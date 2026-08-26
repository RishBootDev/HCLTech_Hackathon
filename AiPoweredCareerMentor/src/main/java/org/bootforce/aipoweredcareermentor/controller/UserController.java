package org.bootforce.aipoweredcareermentor.controller;


import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import org.bootforce.aipoweredcareermentor.dto.AuthRequest;
import org.bootforce.aipoweredcareermentor.dto.AuthResponse;
import org.bootforce.aipoweredcareermentor.dto.ProfileDto;
import org.bootforce.aipoweredcareermentor.service.ProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin
public class UserController {

    private final ProfileService profileService;

    @PostMapping("/login")
    public AuthResponse login(@RequestBody AuthRequest authRequest) {
        return profileService.login(authRequest);
    }

    @PostMapping("/signup")
    public String signup(@RequestBody ProfileDto pdto) {
        return profileService.signup(pdto);
    }
}
