package com.spring.boot.super30.backend.security.handler;

import com.spring.boot.super30.backend.security.jwt.JwtService;
import com.spring.boot.super30.backend.security.service.CustomUserDetails;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URI;
import java.util.*;

@Component
@RequiredArgsConstructor
@Slf4j
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtService jwtService;

    // Use a default fallback to avoid application crash if property is missing
    @Value("${app.oauth2.authorizedRedirectUris:http://localhost:5173/oauth-success}")
    private List<String> authorizedRedirectUris;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException, ServletException {

        // 1. Safely extract CustomUserDetails with null and type checks
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            log.error("Authentication principal is invalid or null");
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid authentication principal");
            return;
        }

        // 2. Clear session-based authentication attributes since we are stateless
        clearAuthenticationAttributes(request);

        Map<String, Object> extraClaims = new java.util.HashMap<>();
        if (userDetails.getUser().getFirstName() != null) {
            extraClaims.put("firstName", userDetails.getUser().getFirstName());
        }
        if (userDetails.getUser().getLastName() != null) {
            extraClaims.put("lastName", userDetails.getUser().getLastName());
        }

        // Generate JWT token including extra claims
        String token = jwtService.generateToken(extraClaims, userDetails);

        // 4. Resolve the redirect URI
        String targetUrl = determineTargetUrl(request);

        // 5. Build final redirect URL with the token
        String finalUrl = UriComponentsBuilder.fromUriString(targetUrl)
                .queryParam("token", token)
                .build().toUriString();

        log.debug("OAuth2 authentication successful. Redirecting to: {}", finalUrl);
        getRedirectStrategy().sendRedirect(request, response, finalUrl);
    }

    private String determineTargetUrl(HttpServletRequest request) {
        String redirectUri = request.getParameter("redirect_uri");

        // If a dynamic redirect URI is provided, validate it against the allowed list
        // to prevent Open Redirect attacks
        if (redirectUri != null && !redirectUri.isBlank()) {
            boolean isAuthorized = authorizedRedirectUris.stream()
                    .anyMatch(authorizedUri -> isValidRedirectUri(redirectUri, authorizedUri));

            if (isAuthorized) {
                return redirectUri;
            } else {
                log.warn("Unauthorized Redirect URI requested: {}. Falling back to default.", redirectUri);
            }
        }

        // Fallback to the first configured URI or the default
        return authorizedRedirectUris.isEmpty() ? "http://localhost:5173/oauth-success" : authorizedRedirectUris.get(0);
    }

    private boolean isValidRedirectUri(String requestUri, String authorizedUriStr) {
        try {
            URI clientRedirectUri = URI.create(requestUri);
            URI authorizedUri = URI.create(authorizedUriStr);

            // A basic check to ensure Host and Port match between request and our trusted
            // list
            return authorizedUri.getHost().equalsIgnoreCase(clientRedirectUri.getHost()) &&
                    authorizedUri.getPort() == clientRedirectUri.getPort();
        } catch (Exception e) {
            return false;
        }
    }
}
