pipeline {
    agent { label 'jenkins_node' }
    
    environment {
        DOCKER_IMAGE = 'chevelleman1/webapi'
        DOCKER_TAG = "${env.BUILD_NUMBER}"
        REGISTRY = 'docker.io'
        // These should be configured in Jenkins credentials
        DOCKER_CREDS = credentials('docker-hub-credentials')
        API_KEY = credentials('api-key')
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out source code...'
                checkout scm
            }
        }
        
        stage('Install Dependencies') {
            steps {
                echo 'Installing dependencies...'
                sh 'npm ci'
            }
        }
        
        // stage('Run Tests') {
        //     steps {
        //         echo 'Running tests...'
        //         sh 'npm test || true'
        //     }
        // }
        
        stage('Build') {
            steps {
                echo 'Building TypeScript...'
                sh 'npm run build'
            }
        }
        
        stage('Build Docker Image') {
            steps {
                echo 'Building Docker image...'
                sh """
                    docker build -t ${DOCKER_IMAGE}:${DOCKER_TAG} .
                    docker tag ${DOCKER_IMAGE}:${DOCKER_TAG} ${DOCKER_IMAGE}:latest
                """
            }
        }
        
        stage('Push to Registry') {
            steps {
                echo 'Pushing Docker image...'
                withCredentials([usernamePassword(credentialsId: 'docker-hub-credentials', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh """
                        echo ${DOCKER_PASS} | docker login -u ${DOCKER_USER} --password-stdin
                        docker push ${DOCKER_IMAGE}:${DOCKER_TAG}
                        docker push ${DOCKER_IMAGE}:latest
                        docker logout
                    """
                }
            }
        }
        
        stage('Deploy to Server') {
            steps {
                echo 'Deploying to server...'
                withCredentials([string(credentialsId: 'api-key', variable: 'API_KEY')]) {
                    sh '''
                        docker pull chevelleman1/webapi:latest
                        docker stop api || true
                        docker rm api || true
                        docker run -d --name api \
                            -e PORT=3000 \
                            -e API_KEY=$API_KEY \
                            -p 3000:3000 \
                            --restart unless-stopped \
                            chevelleman1/webapi:latest
                    '''
                }
            }
        }
    }
    
    post {
        success {
            echo 'Deployment successful!'
        }
        failure {
            echo 'Deployment failed!'
        }
    }
}
