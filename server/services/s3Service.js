import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from 'dotenv';
dotenv.config();

// Initialize S3 Client only if keys are present
const s3Client = (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
    ? new S3Client({
        region: process.env.AWS_REGION || "us-east-1",
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
    })
    : null;

export const uploadToS3 = async (buffer, fileName, mimeType = "audio/mpeg") => {
    if (!s3Client) {
        throw new Error("AWS Credentials not configured");
    }

    const bucketName = process.env.S3_BUCKET_NAME;
    if (!bucketName) {
        throw new Error("S3_BUCKET_NAME not configured");
    }

    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: `audio/${fileName}`,
        Body: buffer,
        ContentType: mimeType,
        // ACL: 'public-read' // Optional: depending on bucket settings
    });

    try {
        await s3Client.send(command);
        // Construct the public URL
        // Note: exact URL format depends on region and bucket config
        const region = process.env.AWS_REGION || "us-east-1";
        return `https://${bucketName}.s3.${region}.amazonaws.com/audio/${fileName}`;
    } catch (error) {
        console.error("S3 Upload Error:", error);
        throw error;
    }
};

export const isS3Enabled = () => {
    return !!(s3Client && process.env.S3_BUCKET_NAME && process.env.USE_S3 === 'true');
};
