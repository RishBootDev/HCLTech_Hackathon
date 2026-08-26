package org.bootforce.aipoweredcareermentor.security;

import org.bootforce.aipoweredcareermentor.enums.Role;
import org.bootforce.aipoweredcareermentor.model.User;
import org.bootforce.aipoweredcareermentor.repository.PersonalMentorAlumniRepo;
import org.bootforce.aipoweredcareermentor.repository.ProfileRepo;
import org.bootforce.aipoweredcareermentor.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProfileRepo profileRepo;

    @Autowired
    private PersonalMentorAlumniRepo mentorRepo;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(username)
                .or(() -> userRepository.findByUsername(username))
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email or username: " + username));

        Object userObject = null;
        if (Role.STUDENT.equals(user.getRole())) {
            userObject = profileRepo.findByUser(user).orElse(null);
        } else if (Role.MENTOR.equals(user.getRole())) {
            userObject = mentorRepo.findByUser(user).orElse(null);
        }

        return new CustomUserDetails(user.getEmail(), user.getPassword(), "ROLE_" + user.getRole().name(), userObject);
    }
}
