package org.bootforce.aipoweredcareermentor.controller;

import lombok.RequiredArgsConstructor;
import org.bootforce.aipoweredcareermentor.dto.DirectMessageDto;
import org.bootforce.aipoweredcareermentor.model.DirectMessage;
import org.bootforce.aipoweredcareermentor.model.User;
import org.bootforce.aipoweredcareermentor.repository.DirectMessageRepo;
import org.bootforce.aipoweredcareermentor.repository.PersonalMentorAlumniRepo;
import org.bootforce.aipoweredcareermentor.repository.ProfileRepo;
import org.bootforce.aipoweredcareermentor.repository.UserRepository;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Controller
@RequiredArgsConstructor
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final DirectMessageRepo messageRepo;
    private final ProfileRepo profileRepo;
    private final PersonalMentorAlumniRepo mentorRepo;
    private final UserRepository userRepository;

    @Transactional
    @MessageMapping("/chat.send")
    public void sendMessage(@Payload DirectMessageDto chatMessageDto) {
        System.out.println("Processing Chat: " + chatMessageDto.getSenderId() + " -> " + chatMessageDto.getRecipientId());

        if (!isSubscribedSafe(chatMessageDto.getSenderId(), chatMessageDto.getRecipientId())) {
            System.out.println("Blocked: No subscription found.");
            return;
        }

        User senderUser = userRepository.findById(chatMessageDto.getSenderId()).orElse(null);
        User recipientUser = userRepository.findById(chatMessageDto.getRecipientId()).orElse(null);
        
        if (senderUser == null || recipientUser == null) return;

        DirectMessage message = DirectMessage.builder()
                .sender(senderUser)
                .recipient(recipientUser)
                .content(chatMessageDto.getContent())
                .sentAt(LocalDateTime.now())
                .build();
        messageRepo.save(message);

        String destRecipient = "/topic/chat." + chatMessageDto.getRecipientId();
        String destSender = "/topic/chat." + chatMessageDto.getSenderId();
        
        messagingTemplate.convertAndSend(destRecipient, chatMessageDto);
        messagingTemplate.convertAndSend(destSender, chatMessageDto);
        
        System.out.println("Dispatched to: " + destRecipient + ", " + destSender);
    }

    private boolean isSubscribedSafe(Long senderId, Long recipientId) {
        Optional<Long> mentorUserId = profileRepo.findMentorUserIdByStudentUserId(senderId);
        if (mentorUserId.isPresent() && mentorUserId.get().equals(recipientId)) {
            return true;
        }

        Optional<Integer> mentorPkId = mentorRepo.findMentorIdByUserId(senderId);
        if (mentorPkId.isPresent()) {
            Optional<Integer> recipientMentorPkId = profileRepo.findMentorIdByStudentUserId(recipientId);
            if (recipientMentorPkId.isPresent() && recipientMentorPkId.get().equals(mentorPkId.get())) {
                return true;
            }
        }

        Optional<Long> reverseMentorUserId = profileRepo.findMentorUserIdByStudentUserId(recipientId);
        if (reverseMentorUserId.isPresent() && reverseMentorUserId.get().equals(senderId)) {
            return true;
        }

        return false;
    }
}
