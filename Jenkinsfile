pipeline {
    agent any

    environment {
        IMAGE_NAME = "virtual-piano"
        IMAGE_TAG = "1.0"
        PROJECT_DIR = "/workspace/virtual-piano"
        TERRAFORM_DIR = "/workspace/virtual-piano/terraform"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Verify Tools') {
            steps {
                sh 'docker --version'
                sh 'terraform version'
                sh 'kubectl version --client'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh '''
                    cd ${PROJECT_DIR}
                    docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .
                '''
            }
        }

        stage('Load Image to Minikube') {
            steps {
                sh '''
                    docker save ${IMAGE_NAME}:${IMAGE_TAG} | \
                    docker exec -i minikube ctr -n k8s.io images import -
                '''
            }
        }

        stage('Terraform Init') {
            steps {
                sh '''
                    terraform -chdir=${TERRAFORM_DIR} init -input=false
                '''
            }
        }

        stage('Terraform Validate') {
            steps {
                sh '''
                    terraform -chdir=${TERRAFORM_DIR} validate
                '''
            }
        }

        stage('Terraform Apply') {
            steps {
                sh '''
                    terraform -chdir=${TERRAFORM_DIR} apply \
                    -auto-approve \
                    -input=false
                '''
            }
        }

        stage('Verify Kubernetes') {
            steps {
                sh '''
                    kubectl get nodes
                    kubectl get deployments
                    kubectl get pods
                    kubectl get services
                '''
            }
        }
    }

    post {
        success {
            echo 'Virtual Piano CI/CD pipeline completed successfully!'
        }

        failure {
            echo 'Pipeline failed. Check the console output.'
        }
    }
}
