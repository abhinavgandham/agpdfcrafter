const DynamoDB = require("@aws-sdk/client-dynamodb");
const DynamoDBLib = require("@aws-sdk/lib-dynamodb");

const tableName = 'n11795611-abhinavgandham-conversions';
const sortKey = 'jobId';

async function initDynamoDB() {
    const client = new DynamoDB.DynamoDBClient({ region: "ap-southeast-2" });
  
    // Check if table exists using if-else
    const describeCommand = new DynamoDB.DescribeTableCommand({
      TableName: tableName
    });
    
    // Boolean Variable to check if the table exists
    const tableExists = await client.send(describeCommand).then(() => true).catch(() => false);
    
    // If the table exists, log a message
    if (tableExists) {
      console.log(`✅ Table ${tableName} already exists`);
    } else {
      console.log(`📝 Creating table ${tableName}...`);
      
      let command = new DynamoDB.CreateTableCommand({
        TableName: tableName,
        AttributeDefinitions: [
          {
            AttributeName: "qut-username",
            AttributeType: "S",
          },
          {
            AttributeName: sortKey,
            AttributeType: "S", // Setting the sort key to String type
          },
        ],
        KeySchema: [
          {
            AttributeName: "qut-username",
            KeyType: "HASH",
          },
          {
            AttributeName: sortKey,
            KeyType: "RANGE",
          },
        ],
        ProvisionedThroughput: {
          ReadCapacityUnits: 1,
          WriteCapacityUnits: 1,
        },
      });
      
      await client.send(command);
      console.log(`✅ Table ${tableName} created successfully`);
    }
  }

  const insertJob = async (username, jobId, 
    originalFileName, convertedFileName,
     fileType, userName, 
     jobResult, timeStamp, 
     fileSize, pdfSize, downloadUrl) => {
    const client = new DynamoDB.DynamoDBClient({ region: "ap-southeast-2" });
    const docClient = DynamoDBLib.DynamoDBDocumentClient.from(client);
    const command = new DynamoDBLib.PutCommand({
        TableName: tableName,
        Item: {
            "qut-username": username,
            "jobId": jobId,
            "originalFileName": originalFileName,
            "convertedFileName": convertedFileName,
            "fileType": fileType,
            "userName": userName,
            "jobResult": jobResult,
            "timeStamp": timeStamp,
            "fileSize": fileSize,
            "pdfSize": pdfSize,
            "downloadUrl": downloadUrl
        }
    })
    await docClient.send(command);
    console.log(`✅ Job ${jobId} inserted into ${tableName}`);
  }

  module.exports = {initDynamoDB, insertJob}