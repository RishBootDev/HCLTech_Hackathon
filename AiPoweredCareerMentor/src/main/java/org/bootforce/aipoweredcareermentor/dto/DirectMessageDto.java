package org.bootforce.aipoweredcareermentor.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DirectMessageDto {
    private Long senderId;
    private Long recipientId;
    private String content;
    private String timestamp;
}
