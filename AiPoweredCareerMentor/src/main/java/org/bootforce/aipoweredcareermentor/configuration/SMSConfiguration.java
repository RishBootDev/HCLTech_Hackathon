
package org.bootforce.aipoweredcareermentor.configuration;

import jakarta.annotation.PostConstruct;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;


@Configuration
public class SMSConfiguration {

    @Value("${twilio.account-sid}")
    private String accountSid;

    @Value("${twilio.auth-token}")
    private String authToken;

    @PostConstruct
    public void init() {
        System.out.println("the twilio configuration is configured properly");
        //Twilio.init(accountSid, authToken);
    }
}
