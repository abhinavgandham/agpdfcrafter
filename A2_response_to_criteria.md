Assignment 2 - Cloud Services Exercises - Response to Criteria
================================================

Instructions
------------------------------------------------
- Keep this file named A2_response_to_criteria.md, do not change the name
- Upload this file along with your code in the root directory of your project
- Upload this file in the current Markdown format (.md extension)
- Do not delete or rearrange sections.  If you did not attempt a criterion, leave it blank
- Text inside [ ] like [eg. S3 ] are examples and should be removed


Overview
------------------------------------------------

- **Name:** Abhinav Gandham
- **Student number:** n11795611
- **Application name:** PDF Converter
- **Two line description:** This is a pdf converter application that supports the coversion of html, md, and docx files to pdf. Users can also view their conversion jobs that have been executed.
- **EC2 instance name or ID:** i-03d50147c0f76db4a

------------------------------------------------

### Core - First data persistence service

- **AWS service name:**  S3
- **What data is being stored?:** PDF files
- **Why is this service suited to this data?:** PDF files are large objects that benefit from scalable storage.
- **Why is are the other services used not suitable for this data?:** Since PDF files are unstructured data, Relational databases like RDS databasases are not suitable.
- **Bucket/instance/table name:** pdfconversions-abhinav-n11795611
- **Video timestamp:** 00:00 - 00:22
- **Relevant files:**
    - src/cloudservices/bucket.js
    - src/middleware/fileConvert.js
    - deployment.yml

### Core - Second data persistence service

- **AWS service name:**  DynamoDB
- **What data is being stored?:** PDF Conversion metadata.
- **Why is this service suited to this data?:** DynamoDB offers sufficient queries for the jobs usecase where either we get all the conversion jobs, or all the conversion jobs by the user.
- **Why is are the other services used not suitable for this data?:** With the usecase of jobs in this application, RDS seemed to provide complexity that was not needed as there are no complex queries being made.
- **Bucket/instance/table name:** n11795611-abhinavgandham-conversions
- **Video timestamp:** 00:22 - 00:49
- **Relevant files:**
    - src/cloudservices/dynamodb.js
    - src/middleware/fileConvert.js
    - deployment.yml

### Third data service

- **AWS service name:**  [eg. RDS]
- **What data is being stored?:** [eg video metadata]
- **Why is this service suited to this data?:** [eg. ]
- **Why is are the other services used not suitable for this data?:** [eg. Advanced video search requires complex querries which are not available on S3 and inefficient on DynamoDB]
- **Bucket/instance/table name:**
- **Video timestamp:**
- **Relevant files:**
    -

### S3 Pre-signed URLs

- **S3 Bucket names:** pdfconversions-abhinav-n11795611
- **Video timestamp:** 00:49 - 1:23
- **Relevant files:**
    - public/src/middleware/fileConvert.js
    - public/src/controllers/downloadController.js

### In-memory cache

- **ElastiCache instance name:**
- **What data is being cached?:** [eg. Thumbnails from YouTube videos obatined from external API]
- **Why is this data likely to be accessed frequently?:** [ eg. Thumbnails from popular YouTube videos are likely to be shown to multiple users ]
- **Video timestamp:**
- **Relevant files:**
    -

### Core - Statelessness

- **What data is stored within your application that is not stored in cloud data services?:** The only thing that is storied within the application is the uploaded file that needs to be converted. Only one file is allowed per upload.
- **Why is this data not considered persistent state?:** This data is not considered persistent state as when the conversion takes place, the upload storage is then cleared. It only serves as a brief temporary stage for the file before conversion.
- **How does your application ensure data consistency if the app suddenly stops?:** Since all the important data is stored in an AWS persistence service, the application will still remember that data during sessions. There are also no persistant connections in the application such as websockets and only HTTP requests are used.
- **Relevant files:**
    - src/middleware/fileUpload.js
    - public/src/middleware/fileConvert.js
    - public/src/controllers/downloadController.js

### Graceful handling of persistent connections

- **Type of persistent connection and use:** [eg. server-side-events for progress reporting]
- **Method for handling lost connections:** [eg. client responds to lost connection by reconnecting and indicating loss of connection to user until connection is re-established ]
- **Relevant files:**
    -


### Core - Authentication with Cognito

- **User pool name:** User pool - p7cvap
- **How are authentication tokens handled by the client?:** tokens are stored in local storage after a successful login. This token is then used in other API requests making them protected routes. When a user logs out, local storage is cleared and the token is removed.
- **Video timestamp:** 1:23 - 2:31
- **Relevant files:**
    - src/controllers/cognitoController.js
    - src/controllers/logoutController.js
    - src/middleware/auth.js
    - src/routes/authRoutes.js
    - public/login.js
    - public/logout.js

### Cognito multi-factor authentication

- **What factors are used for authentication:** password, and email code.
- **Video timestamp:** 2:31 - 3:39
- **Relevant files:**
    - src/controllers/cognitoController.js
    - public/login.js

### Cognito federated identities

- **Identity providers used:**
- **Video timestamp:**
- **Relevant files:**
    -

### Cognito groups

- **How are groups used to set permissions?:** There are two groups which are The normal user group, and the admin group. Normal users can convert files to pdf, and view their respective conversion jobs. Admins however can also view all the users in the application and promote/demote other admins. They can also view all the conversion jobs that have occured.
- **Video timestamp:** 3:39 - 7:10
- **Relevant files:**
    - src/controllers/cognitoController.js
    - public/login.js
    - public/users.js

### Core - DNS with Route53

- **Subdomain**: agpdfconverter.cab432.com
- **Video timestamp:** 7:10 - 7:37

### Parameter store

- **Parameter names:**
    - /n11795611-abhinavgandham-cab432/app/s3-download-expiration
    - /n11795611-abhinavgandham-cab432/app/file-upload-limit 
    - /n11795611-abhinavgandham-cab432/app/cognito-client-secret-name 
    - /n11795611-abhinavgandham-cab432/app/cognito-client-id-secret-name
    - /n11795611-abhinavgandham-cab432/app/user-pool-id-secret-name, 
    - /n11795611-abhinavgandham-cab432/app/dynamodb-table-secret-name
- **Video timestamp:** 7:37 - 8:10
- **Relevant files:**
    - src/cloudservices/parameterStore.js
    - src/cloudservices/secretsManager.js
    - src/middleware/fileUpload.js
    - src/middleware/fileConvert.js

### Secrets manager

- **Secrets names:**
    - n11795611-userPoolId-assessment2
    - n11795611-cognitoClientId-assessment2
    - n11795611-bucketName-assessment2
    - n11795611-dynamoDBTableName-assessment2
    - n11795611-cognitoSecret-assessment2
- **Video timestamp:** 8:10 - 8:47
- **Relevant files:**
    - src/cloudservices/secretsManager.js

### Infrastructure as code

- **Technology used:** AWS CloudFormation
- **Services deployed:** S3, DynamoDB, Parameter Store, Cognito User Groups, and the EC2 Instance. Due to AWS permission issues, Route53 and Secrets Manager setup was not possible in CloudFormation.
- **Video timestamp:**
- **Relevant files:**
    - deployment.yml

### Other (with prior approval only)

- **Description:**
- **Video timestamp:**
- **Relevant files:**
    -

### Other (with prior permission only)

- **Description:**
- **Video timestamp:**
- **Relevant files:**
    -