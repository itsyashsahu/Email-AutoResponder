import { gmail_v1, google } from 'googleapis';

/**
 * Sends an email using the provided Gmail instance.
 * @param {gmail_v1.Gmail} gmail - The authenticated Gmail instance.
 * @param {string} recipientEmail - The email address of the recipient.
 * @param {string} subject - The subject of the email.
 * @param {string} message - The message body of the email.
 */

export default async function sendGmail(
    gmail: gmail_v1.Gmail,
    recipientEmail: string,
    subject: string,
    message: string
): Promise<void> {
    const to = recipientEmail;

    // Encode the subject using Base64 to support non-ASCII characters
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;

    // Construct the message body
    const messageParts = [
        `To: ${to}`,
        'Content-Type: text/html; charset=utf-8',
        `Subject: ${utf8Subject}`,
        '',
        `${message}`
    ];
    const messageBody = messageParts.join('\n');

    // Encode the message body using Base64
    const encodedMessage = Buffer.from(messageBody).toString('base64');

    // Send the email using the Gmail API
    const request = gmail.users.messages.send({
        userId: 'me',
        requestBody: {
            raw: encodedMessage
        }
    });

    // Handle the response or error
    try {
        const response = await request;
        console.log(`Message sent to ${to}.`);
    } catch (error) {
        console.error(`Error sending message: ${error}`);
    }
}
