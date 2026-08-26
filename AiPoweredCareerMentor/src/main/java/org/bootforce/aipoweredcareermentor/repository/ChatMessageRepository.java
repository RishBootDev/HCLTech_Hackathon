package org.bootforce.aipoweredcareermentor.repository;

import org.bootforce.aipoweredcareermentor.model.ChatMessage;
import org.bootforce.aipoweredcareermentor.model.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByProfileIdOrderByTimestampAsc(Integer profileId);
    List<ChatMessage> findBySessionOrderByCreatedAtAsc(ChatSession session);
}
