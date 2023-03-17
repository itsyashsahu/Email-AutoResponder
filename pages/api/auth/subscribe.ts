import { getServerSession } from "next-auth/next"
import { authOptions } from "./[...nextauth]"
import { google } from "googleapis";
import clientPromise from "../../../lib/mongodb";
import type { NextApiRequest, NextApiResponse } from 'next'
import { PubSub } from '@google-cloud/pubsub';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const session = await getServerSession(req, res, authOptions)
    if (session) {
        console.log("🚀 ~ session:", session)
        const email = session.user.email
        console.log("🚀 ~ email:", email)
        const client = await clientPromise
        const db = client.db()

        try {
            var documents = await db.collection('users').aggregate([
                {
                    $match: {
                        email: email
                    }
                },
                {
                    $lookup: {
                        from: 'accounts',
                        localField: '_id',
                        foreignField: 'userId',
                        as: 'accounts'
                    }
                },
                {
                    $unwind: '$accounts'
                },
                {
                    $project: {
                        accessToken: '$accounts.access_token',
                        refreshToken: '$accounts.refresh_token'
                    }
                }
            ]).toArray()

            const accessToken = documents[0].accessToken;
            const refreshToken = documents[0].refreshToken;


            // // // Create a new Google OAuth2 client with the access token
            const authClient = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
            authClient.setCredentials({ access_token: accessToken, refresh_token: refreshToken });

            // Set up Gmail API client
            const gmail = google.gmail({
                version: 'v1',
                auth: authClient
            });

            // const topic = 'projects/email-autoresponder-380605/topics/auto-responder';

            const projectId = 'email-autoresponder-380605';
            const pubsubClient = new PubSub({ projectId, credentials: require("../../../private_key.json") });
            const topicName = 'auto-responder';
            const topic = pubsubClient.topic(topicName);

            const subscriptionName = `my-subscription-${email.replace('@', '-')}`;
            topic.createSubscription(subscriptionName, async (err, subscription) => {
                if (err) {
                    console.error(`Error creating subscription: ${err}`);
                    return;
                }
                console.log("success createing the subscription :", subscriptionName)
                // Set up the watch request
                const request = {
                    userId: 'me',
                    requestBody: {
                        labelIds: ['INBOX'],
                        topicName: 'projects/email-autoresponder-380605/topics/auto-responder',
                        labelFilterAction: 'include'
                    }
                };
                // Call the watch() method to start watching for new messages
                gmail.users.watch(request, (err, res) => {
                    if (err) {
                        console.error(`Error watching for new messages: ${err}`);
                        return;
                    }
                    console.log(`Watching for new messages. Subscription ID: ${subscriptionName}`);
                    // res.status(200).json({ "success": true });
                });

                // Listen for new messages
                subscription?.on('message', (message) => {
                    console.log(`Received new message: ${message}`);
                    console.log(`Received new messageasdfasdf: ${message.data}`);
                    // Process the message here
                    message.ack();
                });
            });
            // return documents
        } catch (error) {
            console.log(error)
            res.status(400).json({ "success": false });
            // throw error
        }
        // Signed in
        // console.log("Session", JSON.stringify(session, null, 2))
        res.status(200).json({ "success": true });

    } else {
        // Not Signed in
        res.status(401).json({ "success": false });
    }
}


export const GOOGLE_APPLICATION_CREDENTIALS = "../../../private_key.json"
