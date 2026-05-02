package com.spring.boot.super30.backend.document.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

import java.io.IOException;
import java.time.Duration;

@Service
@RequiredArgsConstructor
@Slf4j
public class S3StorageService {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;

    @Value("${aws.s3.bucket}")
    private String bucket;

    /**
     * Upload a file to S3 with the given key and storage class.
     */
    public void uploadFile(MultipartFile file, String key, StorageClass storageClass) throws IOException {
        log.info("Uploading file to S3: bucket={}, key={}, storageClass={}", bucket, key, storageClass);

        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType(file.getContentType())
                .storageClass(storageClass)
                .build();

        s3Client.putObject(request, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
        log.info("Successfully uploaded file to S3: {}", key);
    }

    /**
     * Generate a presigned download URL valid for 15 minutes.
     */
    public String generatePresignedUrl(String key) {
        log.debug("Generating presigned URL for key: {}", key);

        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(15))
                .getObjectRequest(b -> b.bucket(bucket).key(key))
                .build();

        return s3Presigner.presignGetObject(presignRequest).url().toString();
    }

    /**
     * Generate a presigned URL for inline viewing (Content-Disposition: inline).
     * This allows browsers to render PDFs and images directly without downloading.
     */
    public String generateViewUrl(String key, String contentType) {
        log.debug("Generating view URL for key: {}, contentType: {}", key, contentType);

        String resolvedContentType = contentType != null ? contentType : "application/octet-stream";

        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(15))
                .getObjectRequest(b -> b
                        .bucket(bucket)
                        .key(key)
                        .responseContentDisposition("inline")
                        .responseContentType(resolvedContentType))
                .build();

        return s3Presigner.presignGetObject(presignRequest).url().toString();
    }

    /**
     * Download object bytes directly via server-side credentials.
     */
    public byte[] getFileBytes(String key) {
        log.debug("Downloading object bytes from S3 for key: {}", key);
        return s3Client.getObjectAsBytes(
                GetObjectRequest.builder()
                        .bucket(bucket)
                        .key(key)
                        .build()
        ).asByteArray();
    }

    /**
     * Change storage class by copying the object to itself with a new storage class.
     */
    public void changeStorageClass(String key, StorageClass targetClass) {
        log.info("Changing storage class for key={} to {}", key, targetClass);

        CopyObjectRequest copyRequest = CopyObjectRequest.builder()
                .sourceBucket(bucket)
                .sourceKey(key)
                .destinationBucket(bucket)
                .destinationKey(key)
                .storageClass(targetClass)
                .build();

        s3Client.copyObject(copyRequest);
        log.info("Storage class changed successfully for key: {}", key);
    }

    /**
     * Initiate restore for objects in DEEP_ARCHIVE or GLACIER.
     * Restored copy available for 7 days, using STANDARD retrieval tier.
     */
    public void initiateRestore(String key) {
        log.info("Initiating restore for key: {}", key);

        RestoreObjectRequest restoreRequest = RestoreObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .restoreRequest(RestoreRequest.builder()
                        .days(7)
                        .glacierJobParameters(GlacierJobParameters.builder()
                                .tier(Tier.STANDARD)
                                .build())
                        .build())
                .build();

        try {
            s3Client.restoreObject(restoreRequest);
            log.info("Restore initiated for key: {}", key);
        } catch (S3Exception e) {
            if (e.statusCode() == 409) {
                log.info("Restore already in progress for key: {}", key);
            } else {
                throw e;
            }
        }
    }

    /**
     * Check if an object has been restored from DEEP_ARCHIVE.
     * Returns true if the object's restore is complete.
     */
    public boolean isRestoreComplete(String key) {
        try {
            HeadObjectResponse response = s3Client.headObject(
                    HeadObjectRequest.builder().bucket(bucket).key(key).build());

            String restore = response.restore();
            if (restore != null && restore.contains("ongoing-request=\"false\"")) {
                log.info("Restore complete for key: {}", key);
                return true;
            }
            return false;
        } catch (S3Exception e) {
            log.error("Error checking restore status for key: {}", key, e);
            return false;
        }
    }

    /**
     * Delete an object from S3.
     */
    public void deleteFile(String key) {
        log.info("Deleting file from S3: {}", key);
        s3Client.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(key).build());
        log.info("Successfully deleted file: {}", key);
    }
}
