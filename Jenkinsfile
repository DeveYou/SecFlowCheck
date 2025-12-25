pipeline {
    agent any

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
                            // Install Python/Pip directly in the container (works because we run as root)
                            sh 'apt-get update && apt-get install -y python3 python3-pip python3-venv'
                            
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
                                    // python3 -m pip is safer than just pip
                                    // using --break-system-packages (if needed on newer debian) or standard install
                                    sh 'python3 -m pip install --upgrade pip --break-system-packages || python3 -m pip install --upgrade pip'
                                    sh 'python3 -m pip install -r requirements.txt --break-system-packages || python3 -m pip install -r requirements.txt'
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
