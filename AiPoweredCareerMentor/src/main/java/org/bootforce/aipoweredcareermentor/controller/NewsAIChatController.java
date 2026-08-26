package org.bootforce.aipoweredcareermentor.controller;

import lombok.RequiredArgsConstructor;
import org.bootforce.aipoweredcareermentor.service.ChatService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/newsai")
@CrossOrigin
@RequiredArgsConstructor
public class NewsAIChatController {

    private final ChatService chatService;

    @PostMapping("/chat")
    public ResponseEntity<Map<String, Object>> chat(
            @RequestParam Integer profileId,
            @RequestParam(required = false) Long sessionId,
            @RequestParam String message) {
        return ResponseEntity.ok(chatService.processMessage(profileId, sessionId, message));
    }

    @GetMapping("/sessions/{profileId}")
    public ResponseEntity<List<Map<String, Object>>> getSessions(
            @PathVariable Integer profileId,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(chatService.getUserSessions(profileId, limit));
    }

    @GetMapping("/sessions/{profileId}/{sessionId}/history")
    public ResponseEntity<List<Map<String, Object>>> getSessionHistory(
            @PathVariable Integer profileId,
            @PathVariable Long sessionId) {
        return ResponseEntity.ok(chatService.getSessionHistory(profileId, sessionId));
    }
}
