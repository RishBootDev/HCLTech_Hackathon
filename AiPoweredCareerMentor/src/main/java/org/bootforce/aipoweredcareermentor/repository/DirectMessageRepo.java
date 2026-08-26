package org.bootforce.aipoweredcareermentor.repository;

import org.bootforce.aipoweredcareermentor.model.DirectMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface DirectMessageRepo extends JpaRepository<DirectMessage, Long> {

    @Query("SELECT d FROM DirectMessage d WHERE (d.sender.id = :u1 AND d.recipient.id = :u2) OR (d.sender.id = :u2 AND d.recipient.id = :u1) ORDER BY d.sentAt ASC")
    List<DirectMessage> findChatHistory(@Param("u1") Long user1Id, @Param("u2") Long user2Id);

    @Query("SELECT d FROM DirectMessage d WHERE d.recipient.id = :recipientId AND d.read = false")
    List<DirectMessage> findUnreadMessages(@Param("recipientId") Long recipientId);

    @Modifying
    @Transactional
    @Query("UPDATE DirectMessage d SET d.read = true WHERE d.recipient.id = :recipientId AND d.sender.id = :senderId")
    int markAsRead(@Param("recipientId") Long recipientId, @Param("senderId") Long senderId);

    @Query("SELECT COUNT(d) FROM DirectMessage d WHERE d.recipient.id = :recipientId AND d.read = false")
    long countUnread(@Param("recipientId") Long recipientId);
}
