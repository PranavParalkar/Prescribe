package com.spring.boot.super30.backend.security.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender javaMailSender;

    /**
     * Send the login/registration OTP email with a branded HTML template.
     */
    public void sendOtpEmail(String to, String otpCode) {
        log.info("Sending OTP email to {}", to);
        String subject = "Your Verification Code — Prescribe";
        String html = buildOtpHtml(
                "Your Verification Code",
                "Use the code below to verify your identity and sign in to Prescribe.",
                otpCode,
                "10 minutes"
        );
        sendHtmlEmail(to, subject, html);
    }

    /**
     * Send the medical-records access OTP email with a branded HTML template.
     */
    public void sendAccessOtpEmail(String to, String doctorName, String otpCode, int expiryMinutes) {
        log.info("Sending access OTP email to {}", to);
        String subject = "Medical Records Access Request — Prescribe";
        String html = buildOtpHtml(
                "Medical Records Access Request",
                "<strong>" + escapeHtml(doctorName) + "</strong> is requesting access to your medical records. "
                        + "Share the code below with the doctor only if you authorize this request.",
                otpCode,
                expiryMinutes + " minutes"
        );
        sendHtmlEmail(to, subject, html);
    }

    /**
     * Generic plain-text email (fallback).
     */
    public void sendEmail(String to, String subject, String text) {
        log.info("Sending email to {} with subject {}", to, subject);
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            javaMailSender.send(message);
            log.info("Email sent successfully to {}", to);
        } catch (Exception e) {
            log.error("Failed to send email to {}", to, e);
            throw new RuntimeException("Failed to send email", e);
        }
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private void sendHtmlEmail(String to, String subject, String html) {
        try {
            MimeMessage mimeMessage = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            javaMailSender.send(mimeMessage);
            log.info("HTML email sent successfully to {}", to);
        } catch (Exception e) {
            log.error("Failed to send HTML email to {}", to, e);
            throw new RuntimeException("Failed to send email", e);
        }
    }

    private String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }

    /**
     * Builds a branded HTML email template matching Prescribe's navy + teal theme.
     */
    private String buildOtpHtml(String heading, String description, String otpCode, String expiresIn) {
        return """
        <!DOCTYPE html>
        <html lang="en">
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
        <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
          <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 16px;">
            <tr>
              <td align="center">
                <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #0f172a 0%%, #1e293b 100%%);padding:32px 40px 28px;text-align:center;">
                      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                        <tr>
                          <td style="width:36px;height:36px;background-color:#14b8a6;border-radius:10px;text-align:center;vertical-align:middle;">
                            <span style="color:#ffffff;font-size:18px;font-weight:bold;line-height:36px;">℞</span>
                          </td>
                          <td style="padding-left:12px;">
                            <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">Prescribe</span>
                          </td>
                        </tr>
                      </table>
                      <p style="color:rgba(255,255,255,0.5);font-size:11px;margin:12px 0 0;letter-spacing:1.5px;text-transform:uppercase;font-weight:600;">
                        Secure · Digital · Instant
                      </p>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="padding:36px 40px 20px;">
                      <h1 style="color:#0f172a;font-size:20px;font-weight:700;margin:0 0 12px;letter-spacing:-0.3px;">
                        %s
                      </h1>
                      <p style="color:#64748b;font-size:14px;line-height:22px;margin:0 0 28px;">
                        %s
                      </p>

                      <!-- OTP Box -->
                      <table role="presentation" width="100%%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <div style="background:linear-gradient(135deg,#f0fdfa 0%%,#f0f9ff 100%%);border:2px solid #99f6e4;border-radius:12px;padding:24px 32px;display:inline-block;">
                              <span style="font-size:36px;font-weight:800;letter-spacing:8px;color:#0f172a;font-family:'Courier New',monospace;">
                                %s
                              </span>
                            </div>
                          </td>
                        </tr>
                      </table>

                      <p style="color:#94a3b8;font-size:12px;text-align:center;margin:16px 0 0;">
                        This code expires in <strong style="color:#0f172a;">%s</strong>
                      </p>
                    </td>
                  </tr>

                  <!-- Divider -->
                  <tr>
                    <td style="padding:0 40px;">
                      <hr style="border:none;border-top:1px solid #e2e8f0;margin:0;">
                    </td>
                  </tr>

                  <!-- Security notice -->
                  <tr>
                    <td style="padding:20px 40px 12px;">
                      <table role="presentation" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="width:20px;vertical-align:top;padding-top:2px;">
                            <span style="color:#f59e0b;font-size:14px;">⚠</span>
                          </td>
                          <td style="padding-left:8px;">
                            <p style="color:#94a3b8;font-size:12px;line-height:18px;margin:0;">
                              If you did not request this code, you can safely ignore this email. Never share your OTP with anyone.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color:#f8fafc;padding:20px 40px;border-top:1px solid #f1f5f9;text-align:center;">
                      <p style="color:#94a3b8;font-size:11px;margin:0;line-height:18px;">
                        © 2026 Prescribe Healthcare. All rights reserved.<br>
                        <span style="color:#cbd5e1;">Prescription management, simplified for modern healthcare.</span>
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
        """.formatted(heading, description, otpCode, expiresIn);
    }
}
