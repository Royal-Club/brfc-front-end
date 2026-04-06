pipeline {
    agent any

    environment {
        APP_STATIC_DIR = '/home/application/feBuild'
        REACT_APP_API_URL = 'https://api.royalfootball.club'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Deploy Static') {
            steps {
                sh '''
                    rsync -av --delete build/ ${APP_STATIC_DIR}/
                    chmod -R 755 ${APP_STATIC_DIR}
                '''
            }
        }
    }

    post {
        success {
            echo 'BRFC frontend deployed successfully to ${APP_STATIC_DIR}'
        }
        failure {
            echo 'Build or deploy failed.'
        }
    }
}
