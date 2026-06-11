# AWS File Sharing System

A production-grade, serverless file sharing platform built on AWS to demonstrate real-world cloud architecture, security, scalability, and infrastructure automation.

This project allows users to securely upload, manage, download, and share files through a modern web application while leveraging AWS managed services and Infrastructure as Code (IaC).

---

## Project Overview

The AWS File Sharing System is designed as a portfolio-quality cloud engineering project that showcases how modern file storage and sharing applications can be built using serverless technologies.

The application provides:

* Secure user authentication
* File upload and download functionality
* File sharing through secure links
* Metadata management
* Monitoring and logging
* Infrastructure as Code deployment
* CI/CD automation

The project follows AWS best practices for security, scalability, and cost optimization.

---

## Architecture

```text
User
 │
 ▼
CloudFront
 │
 ▼
React Frontend
 │
 ▼
API Gateway
 │
 ▼
AWS Lambda
 │
 ├────────► Amazon S3
 │
 ├────────► DynamoDB
 │
 └────────► Amazon Cognito
```

---

## Technology Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS

### Backend

* AWS Lambda
* Amazon API Gateway

### Authentication

* Amazon Cognito

### Storage

* Amazon S3

### Database

* Amazon DynamoDB

### Infrastructure as Code

* Terraform

### Monitoring

* Amazon CloudWatch

### CI/CD

* GitHub Actions

---

## Key Features

### User Authentication

* User registration
* User login
* Secure authentication using Amazon Cognito
* MFA support

### File Management

* Upload files
* Download files
* Delete files
* View uploaded files

### File Sharing

* Generate secure sharing links
* Expiring download URLs
* Controlled file access

### Security

* Private S3 buckets
* IAM role-based access
* HTTPS/TLS encryption
* JWT authentication

### Monitoring

* CloudWatch logging
* Error monitoring
* Operational dashboards

---

## Project Structure

```text
aws-file-sharing-system/

├── frontend/
├── backend/
├── terraform/
├── docs/
│   ├── screenshots/
│   ├── diagrams/
│   ├── videos/
│   ├── deployment-guide/
│   ├── architecture/
│   └── interview-notes/
│
├── .github/
├── README.md
└── .gitignore
```

---

## Learning Objectives

This project demonstrates practical experience with:

* AWS Serverless Architecture
* Infrastructure as Code (Terraform)
* Cloud Security Best Practices
* Identity and Access Management
* Object Storage Design
* API Development
* Monitoring and Observability
* CI/CD Pipelines
* Cost Optimization

---

## Documentation

Project documentation will include:

* Architecture diagrams
* Deployment guides
* AWS configuration screenshots
* Interview preparation notes
* Cost analysis
* Demo walkthrough videos

---

## Project Status

🚧 Currently in Development

### Planned Milestones

* [x] AWS Account Setup
* [x] Project Structure Initialization
* [ ] Frontend Setup
* [ ] Authentication System
* [ ] File Upload Service
* [ ] File Download Service
* [ ] File Sharing System
* [ ] Monitoring & Logging
* [ ] Terraform Infrastructure
* [ ] CI/CD Pipeline
* [ ] Production Deployment

---

## Author

Built as a cloud engineering portfolio project to demonstrate practical AWS, DevOps, and Infrastructure as Code skills.

---

## License

This project is intended for educational, portfolio, and learning purposes.
