package org.bootforce.aipoweredcareermentor.controller;

import lombok.RequiredArgsConstructor;
import org.bootforce.aipoweredcareermentor.model.DirectMessage;
import org.bootforce.aipoweredcareermentor.repository.DirectMessageRepo;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@CrossOrigin
public class MessageController {

    private final DirectMessageRepo messageRepo;

    @GetMapping("/history")
    public List<DirectMessage> getChatHistory(@RequestParam Long user1Id, @RequestParam Long user2Id) {
        return messageRepo.findChatHistory(user1Id, user2Id);
    }

    @GetMapping("/unread/{recipientId}")
    public ResponseEntity<List<DirectMessage>> getUnreadMessages(@PathVariable Long recipientId) {
        return ResponseEntity.ok(messageRepo.findUnreadMessages(recipientId));
    }

    @GetMapping("/unread-count/{recipientId}")
    public ResponseEntity<Map<String, Long>> getUnreadCount(@PathVariable Long recipientId) {
        long count = messageRepo.countUnread(recipientId);
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    @PutMapping("/mark-read")
    public ResponseEntity<Map<String, Integer>> markMessagesAsRead(
            @RequestParam Long recipientId,
            @RequestParam Long senderId) {
        int updated = messageRepo.markAsRead(recipientId, senderId);
        return ResponseEntity.ok(Map.of("markedAsRead", updated));
    }
}
