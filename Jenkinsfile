pipeline {
    agent any

    triggers {
        pollSCM '* * * * *'
    }

    environment {
        // Define common environment variables here if needed
        DOCKER_REGISTRY_CREDENTIALS_ID = 'docker-hub-credentials' // Example ID
        DOCKER_REGISTRY_URL = 'my-docker-registry' // Example URL
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build & Test') {
            parallel {
                stage('Java Services') {
                    tools {
                        maven 'Maven 3.9.6' // Ensure this matches your Jenkins Global Tool Configuration
                        jdk 'jdk-17'        // Ensure this matches your Jenkins Global Tool Configuration
                    }
                    steps {
                        script {
                            def javaServices = ['secflowcheck-gateway', 'secflowcheck-discovery']
                            javaServices.each { service ->
                                dir(service) {
                                    echo "Building ${service}..."
                                    // Using -DskipTests to speed up initial pipeline setup. Remove to run tests.
                                    sh 'mvn clean package -DskipTests'
                                }
                            }
                        }
                    }
                }

                stage('Python Services') {
                    steps {
                        script {
                            // Install Python/Pip/Venv
                            // python3-full ensures we have all standard lib modules
                            sh 'apt-get update && apt-get install -y python3-full python3-venv'
                            
                            def pythonServices = [
                                'secflowcheck-authentication',
                                'secflowcheck-model',
                                'secflowcheck-parser',
                                'secflowcheck-report',
                                'secflowcheck-analyzer'
                            ]
                            pythonServices.each { service ->
                                dir(service) {
                                    echo "Building ${service}..."
                                    // Create a virtual environment to avoid system package conflicts
                                    sh 'rm -rf venv'
                                    sh 'python3 -m venv venv'
                                    
                                    // Use the pip inside the virtual environment
                                    sh 'venv/bin/pip install --default-timeout=1000 --upgrade pip'
                                    sh 'venv/bin/pip install --default-timeout=1000 --retries=20 -r requirements.txt'
                                }
                            }
                        }
                    }
                }

                stage('Frontend') {
                    tools {
                        nodejs 'node-18' // Must match Global Tool Configuration
                    }
                    steps {
                        dir('secflowcheck-frontend-v2') {
                            echo "Building Frontend..."
                            sh 'npm install'
                            sh 'npm run build'
                        }
                    }
                }
            }
        }

        stage('SonarQube Analysis') {
            parallel {
                stage('Java Analysis') {
                    tools {
                        maven 'Maven 3.9.6'
                        jdk 'jdk-17'
                    }
                    steps {
                        script {
                            def javaServices = ['secflowcheck-gateway', 'secflowcheck-discovery']
                            javaServices.each { service ->
                                dir(service) {
                                    echo "Running SonarQube for ${service}..."
                                    try {
                                        sh "mvn org.sonarsource.scanner.maven:sonar-maven-plugin:3.10.0.2594:sonar -Dsonar.projectKey=${service} -Dsonar.host.url=http://sonarqube:9000 -Dsonar.login=admin -Dsonar.password=admin"
                                    } catch (Exception e) {
                                        echo "SonarQube analysis failed for ${service}: ${e.message}"
                                    }
                                }
                            }
                        }
                    }
                }
                stage('Data & Frontend Analysis') {
                    tools {
                        nodejs 'node-18' 
                    }
                    steps {
                        script {
                            // Python Services
                            def pythonServices = [
                                'secflowcheck-authentication',
                                'secflowcheck-model',
                                'secflowcheck-parser',
                                'secflowcheck-report',
                                'secflowcheck-analyzer'
                            ]
                             pythonServices.each { service ->
                                dir(service) {
                                     echo "Running SonarQube for ${service}..."
                                     try {
                                         // Using npx to run sonar-scanner without installing binary on host
                                         sh "npx -y sonar-scanner -Dsonar.projectKey=${service} -Dsonar.sources=. -Dsonar.host.url=http://sonarqube:9000 -Dsonar.login=admin -Dsonar.password=admin"
                                     } catch (Exception e) {
                                         echo "SonarQube analysis failed for ${service}: ${e.message}"
                                     }
                                }
                            }

                            // Frontend
                            dir('secflowcheck-frontend-v2') {
                                echo "Running SonarQube for Frontend..."
                                try {
                                    sh 'npx -y sonar-scanner -Dsonar.projectKey=secflowcheck-frontend-v2 -Dsonar.sources=src -Dsonar.host.url=http://sonarqube:9000 -Dsonar.login=admin -Dsonar.password=admin'
                                } catch (Exception e) {
                                    echo "SonarQube analysis failed for Frontend: ${e.message}"
                                }
                            }
                        }
                    }
                }
            }
        }

        stage('Docker Build') {
            steps {
                script {
                    def allServices = [
                        'secflowcheck-gateway',
                        'secflowcheck-discovery',
                        'secflowcheck-authentication',
                        'secflowcheck-model',
                        'secflowcheck-parser',
                        'secflowcheck-report',
                        'secflowcheck-analyzer',
                        'secflowcheck-frontend-v2'
                    ]
                    
                    allServices.each { service ->
                        dir(service) {
                            echo "Building Docker image for ${service}..."
                            // Assuming Docker is installed on the agent
                            // sh "docker build -t ${service}:latest ."
                            echo "Docker build command placeholder: docker build -t ${service}:latest ."
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}
