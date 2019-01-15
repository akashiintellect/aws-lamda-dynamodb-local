'use strict';
const AWS = require('aws-sdk');
const _ = require('lodash');
const uuidv1 = require('uuid/v1');
const config = require('./config/config.js');
AWS.config.update(config.aws_local_config);
const ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

module.exports.track = async (event) => {
    try{
        let TrackID = uuidv1();
        const object = await JSON.parse(event.body);
        const UserID = object.user.ID;
        const ToTalSpendingTime = object.totalSpendingTime;
        let dataNeeded = [];
        _.forEach( object.activities, (piece) => {
            const UUID = uuidv1();
            const { type, dateAndTime } = piece;
            const marshalled = AWS.DynamoDB.Converter.marshall({
                UUID, TrackID, UserID, Activity:type, DateAndTime:dateAndTime, ToTalSpendingTime
            });
            const params = {
                TableName: config.aws_table_name,
                Item: marshalled
            };
            dataNeeded.push(params);
        });
        for(let i = 0; i <dataNeeded.length; i++) {
            await ddb.putItem(dataNeeded[i], function (err, data) {
                if (err) {
                    console.log("error", err);
                }
            });
            console.log("event body",dataNeeded[i]);
        }
        return {
            statusCode:200,
            success: true,
            message: 'Activity Added'
        };
    }
    catch (error) {
        return {
            success: false,
            message: error
        };
    }

    // Use this code if you don't use the http event with the LAMBDA-PROXY integration
    // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};
