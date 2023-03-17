
import { google } from "googleapis";
import clientPromise from "../../lib/mongodb";
import type { NextApiRequest, NextApiResponse } from 'next'
import { OAuth2Client, Credentials } from 'google-auth-library';
import { GaxiosResponse } from 'gaxios';
import moment from "moment";
import sendGmail from "../../lib/sendGmail";
import { gmail_v1 } from 'googleapis';


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("api Got Hit Hello -------------------------- ");
  const message = req.body.message
  const decodedMessage = Buffer.from(message?.data, 'base64').toString('utf-8');
  const DecodeMsg = JSON.parse(decodedMessage);
  const { historyId, emailAddress } = DecodeMsg
  console.log("🚀 ~ decodedMessage:", decodedMessage)

  const email = emailAddress
  const client = await clientPromise
  const db = client.db()

  let refreshToken, accessToken;
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

    refreshToken = documents[0].refreshToken;
    accessToken = documents[0].accessToken;
    // return documents
  } catch (error) {
    console.log("Error occurred while fetching refreshToken", error)
  }


  // Create a new Google OAuth2 client with the access token
  const authClient = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "openid email profile https://mail.google.com/ https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/userinfo.profile"
  );


  try {
    accessToken = await refreshAccessToken(refreshToken, authClient);
    // console.log("🚀 ~ New accessToken Generated Successfully -- :", accessToken)
  } catch (err) {
    console.log("🚀 ~ error occurred while generating new accessToken:", err)
  }

  // set the new accessToken
  authClient.setCredentials({ refresh_token: refreshToken, access_token: accessToken });


  // Use the authenticated client to access the Gmail API
  const gmail = google.gmail({ version: "v1", auth: authClient });
  // const response = await gmail.users.messages.list({ userId: "me" });
  // console.log("🚀 ~ response:", response)
  const messageHistorySnapshot = await gmail.users.history.list({
    userId: email,
    startHistoryId: historyId,
  });


  // console.log("🚀 ~ messageHistorySnapshot: data outside if", messageHistorySnapshot.data)
  let latestEmailId
  let doSendEmail = false;

  // Check the history snapshot type does it Corresponds to a new email 
  // but somehow the one not corresponds to new email comes always earlier and regularly needs to check more on this.
  if (messageHistorySnapshot.data?.history) {
    // this history id corresponds to the new email
    console.log("🚀 ~ this history id corresponds to the new email ----------------")

    // console.log("🚀 ~ messageHistorySnapshot: data inif", messageHistorySnapshot.data?.history[0])
    const msg = messageHistorySnapshot?.data?.history[0]?.messages?.[0]
    latestEmailId = msg?.id;
    // doSendEmail = true;

  } else {
    // this history id does not corresponds to the new email 
    console.log("this history id is not related to the New message")
    doSendEmail = true;
    try {
      const response = await gmail.users.messages.list({
        userId: 'me',
      });
      latestEmailId = response?.data?.messages?.[0]?.id ?? null;

    } catch (error) {
      console.error('Failed to fetch latest email of the user:', error);
    }

  }

  // send the email if the latest email is Id is valid doSendEmail is true
  if (latestEmailId && doSendEmail) {
    const { senderEmail, receivedTime } = await getSenderEmailAndReceivedTime(gmail, latestEmailId)

    // check if the email is new i.e recieved with in 1 minutes
    if (isReceivedWithinXMinutes(receivedTime, 1)) {
      console.log("🚀 ~ isReceivedWithinXMinutes: -------------------------------- Yes")

      // Sending the customized email to the sender
      try {
        const recipientEmail = senderEmail
        // const recipientEmail = "weareanimefanshere@gmail.com"
        // const subject = "Email recived from " + senderEmail;
        const subject = "I am on vacation";
        const mailmsg = "Hii, I am on the vacation will report to you after 3 days ";
        const result = await sendGmail(gmail, recipientEmail, subject, mailmsg);
        console.log("🚀 ~ res:", result)
        console.log("-----------------------------------------------------------------------------------Message sent Successfully")
        return res.status(200).send('OK')

      } catch (error) {
        console.error(`Error sending email: ${error}`);
      }

    } else {
      // the request if now valid for now
      console.log("🚀 ~ isReceivedWithinXMinutes: --------- No")
    }

  } else {
    // throw new Error("Latest emailId not found");
    console.log("Email is not Send to ", latestEmailId)
  }

  console.log("something went wrong")
  res.status(200).send('OK');
}

type Schema$Message = gmail_v1.Schema$Message;
async function getSenderEmailAndReceivedTime(gmail: gmail_v1.Gmail, latestEmailId: string): Promise<{ senderEmail: string | null, receivedTime: string }> {
  let latestEmail: GaxiosResponse<Schema$Message>;
  if (latestEmailId) {
    latestEmail = await gmail.users.messages.get({ userId: 'me', id: latestEmailId });

    const headers = latestEmail?.data?.payload?.headers || [];
    const fromHeader = headers.find(header => header?.name?.toLowerCase() === 'from');
    const timeHeader = headers.find(header => header?.name?.toLowerCase() === 'date');
    const senderEmailString = fromHeader?.value || 'Unknown Sender';
    const oneYearAgo = new Date(Date.now() - 31536000000);
    const receivedTime = timeHeader ? new Date(timeHeader.value || oneYearAgo).toLocaleString() : 'Unknown Time';

    // extracting the email address
    const emailRegex = /<(.+)>/;
    const match = senderEmailString.match(emailRegex);
    const senderEmail = match ? match[1] : null;

    return { senderEmail, receivedTime };
  } else {
    throw new Error('latestEmailId is not provided');
  }
}


async function validateAccessToken(accessToken: string, oAuth2Client: OAuth2Client): Promise<boolean> {
  try {
    // Verify the ID token with Google OAuth2
    const ticket = await oAuth2Client.verifyIdToken({
      idToken: accessToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    // Extract the payload from the verified token
    const payload = ticket.getPayload();
    // The token is valid
    return true;
  } catch (err) {
    // The token is invalid
    return false;
  }
}

export async function refreshAccessToken(refreshToken: string, oauth2Client: OAuth2Client): Promise<string> {
  // Set the refresh token in the auth client's credentials
  const credentials: Credentials = {
    refresh_token: refreshToken,
  };
  oauth2Client.setCredentials(credentials);

  // Refresh the access token using the auth client
  const newTokens = await oauth2Client.refreshAccessToken();
  const accessToken = newTokens?.res?.data.access_token ?? null;

  if (!accessToken) {
    return Promise.reject("Access token is null");
  }

  return accessToken;
}

function isReceivedWithinXMinutes(receivedTime: string, x: number): boolean {
  const format = 'DD/M/YYYY, h:mm:ss a';
  const date = moment(receivedTime, format).toDate();
  const receivedDateTime = new Date(date);
  const now = new Date();
  const minutesAgo = (now.getTime() - receivedDateTime.getTime()) / (1000 * 60);

  if (minutesAgo <= x) {
    console.log(`The message was received ${minutesAgo} minutes ago.`);
    return true;
  } else {
    console.log(`The message was received more than ${x} minutes ago.`);
    return false;
  }
}
