package org.bootforce.aipoweredcareermentor.listener;

import lombok.RequiredArgsConstructor;
import org.bootforce.aipoweredcareermentor.service.UserPresenceService;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import java.util.Map;

import java.util.Objects;

@Component
@RequiredArgsConstructor
public class PresenceEventListener {

    private final UserPresenceService presenceService;
    private final SimpMessagingTemplate messagingTemplate;

    @EventListener
    public void handleSessionConnect(SessionConnectEvent event) {
        StompHeaderAccessor headers = StompHeaderAccessor.wrap(event.getMessage());
        String userIdStr = headers.getFirstNativeHeader("userId");
        if (userIdStr != null) {
            try {
                Long userId = Long.parseLong(userIdStr);
                presenceService.userConnected(userId);
                // Store userId in session attributes for disconnect event
                Objects.requireNonNull(headers.getSessionAttributes()).put("userId", userId);
                messagingTemplate.convertAndSend("/topic/status", Map.of("userId", userId, "online", true));
                System.out.println("User connected: " + userId);
            } catch (NumberFormatException e) {
                System.err.println("Invalid userId header: " + userIdStr);
            }
        }
    }

    @EventListener
    public void handleSessionDisconnect(SessionDisconnectEvent event) {
        StompHeaderAccessor headers = StompHeaderAccessor.wrap(event.getMessage());
        Long userId = (Long) Objects.requireNonNull(headers.getSessionAttributes()).get("userId");
        if (userId != null) {
            presenceService.userDisconnected(userId);
            messagingTemplate.convertAndSend("/topic/status", Map.of("userId", userId, "online", false));
            System.out.println("User disconnected: " + userId);
        }
    }
}
