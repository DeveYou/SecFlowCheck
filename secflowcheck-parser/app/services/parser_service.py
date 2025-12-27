import yaml
import re
from fastapi import HTTPException
from app.models.schemas import ParsedPipeline, FeatureVector, Finding

class ParserService:
    # Improved regex to avoid false positives on simple keys like 'password_input' vs actual values
    # But for "has_secrets", we want to be paranoid.
    SECRETS_PATTERN = r"(?i)(password|secret|token|key|api_key|access_key)\s*[:=]\s*['\"]?[a-zA-Z0-9_\-\$]+['\"]?"
    # A generic "value" look up.
    
    # Simple keyword search for values that look like secrets
    SECRET_VALUE_KEYWORDS = ["password", "secret", "token", "key"]
    
    PERMISSIONS_PATTERN = r"(?i)(write-all|admin|sudo|privileged|docker\.sock)"

    def parse_and_extract(self, content: str, filename: str) -> ParsedPipeline:
        try:
            data = yaml.safe_load(content)
        except yaml.YAMLError as exc:
            raise HTTPException(status_code=400, detail=str(exc))
        
        if not data:
            return ParsedPipeline(
                filename=filename,
                content={},
                features=FeatureVector(num_jobs=0, num_steps=0, has_secrets=0, privileged_access=0),
                findings=[]
            )

        features, findings = self._extract_features(data)
        
        return ParsedPipeline(
            filename=filename,
            content=data if isinstance(data, dict) else {"raw": data},
            features=features,
            findings=findings
        )

    def _count_jobs_and_steps(self, data: dict):
        num_jobs = 0
        num_steps = 0
        
        if not isinstance(data, dict):
            return num_jobs, num_steps

        # Heuristic for Jobs
        if 'jobs' in data: # GitHub
            jobs = data['jobs']
            if isinstance(jobs, dict):
                num_jobs = len(jobs)
                for _, j in jobs.items():
                    if isinstance(j, dict) and 'steps' in j:
                        num_steps += len(j['steps'])
        else: # GitLab or generic
            # Count keys that look like jobs (have 'script' or 'stage')
            for _, v in data.items():
                if isinstance(v, dict) and ('script' in v or 'stage' in v):
                    num_jobs += 1
                    if 'script' in v:
                        if isinstance(v['script'], list):
                            num_steps += len(v['script'])
                        else:
                            num_steps += 1
        return num_jobs, num_steps

    def _extract_features(self, data: dict):
        findings = []
        
        # Count jobs and steps
        num_jobs, num_steps = self._count_jobs_and_steps(data)

        # Recursive scan
        self._traverse(data, "", findings)

        # Aggregate features
        has_secrets = 1 if any(f.type == 'secret' for f in findings) else 0
        privileged_access = 1 if any(f.type == 'permission' for f in findings) else 0

        return FeatureVector(
            num_jobs=num_jobs,
            num_steps=num_steps,
            has_secrets=has_secrets,
            privileged_access=privileged_access
        ), findings

    def _check_string_value(self, value, path, findings):
        if re.search(self.SECRETS_PATTERN, value):
             findings.append(Finding(
                 type='secret', 
                 message="Secret pattern detected in value", 
                 location=path, 
                 severity="CRITICAL"
            ))
        if re.search(self.PERMISSIONS_PATTERN, value):
             findings.append(Finding(
                 type='permission', 
                 message="Privileged access detected", 
                 location=path, 
                 severity="HIGH"
            ))

    def _traverse_dict(self, obj, path, findings):
        for k, v in obj.items():
            current_path = f"{path}.{k}" if path else str(k)
            # Check for suspicious keys (env vars etc) - only if key is a string
            if isinstance(k, str) and any(s in k.lower() for s in self.SECRET_VALUE_KEYWORDS):
                # If the value looks like a hardcoded string
                if isinstance(v, str) and not v.startswith('$') and '{{' not in v:
                        findings.append(Finding(
                            type='secret', 
                            message=f"Potential secret in key '{k}'", 
                            location=current_path, 
                            severity="CRITICAL"
                    ))
            
            self._traverse(v, current_path, findings)

    def _traverse_list(self, obj, path, findings):
        for i, item in enumerate(obj):
            self._traverse(item, f"{path}[{i}]", findings)

    def _traverse(self, obj, path, findings):
        if isinstance(obj, dict):
            self._traverse_dict(obj, path, findings)
        
        elif isinstance(obj, list):
            self._traverse_list(obj, path, findings)
        
        elif isinstance(obj, str):
            self._check_string_value(obj, path, findings)
