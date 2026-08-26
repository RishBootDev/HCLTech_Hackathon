package org.bootforce.aipoweredcareermentor.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import lombok.RequiredArgsConstructor;
import org.bootforce.aipoweredcareermentor.dto.*;
import org.bootforce.aipoweredcareermentor.enums.Role;
import org.bootforce.aipoweredcareermentor.exception.ResourceNotFoundException;
import org.bootforce.aipoweredcareermentor.model.*;
import org.bootforce.aipoweredcareermentor.repository.PersonalMentorAlumniRepo;
import org.bootforce.aipoweredcareermentor.repository.ProfileRepo;
import org.bootforce.aipoweredcareermentor.repository.UserRepository;
import org.bootforce.aipoweredcareermentor.security.JwtUtils;
import org.modelmapper.ModelMapper;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final ProfileRepo repo;
    private final GemmaService aiservice;
    private final ModelMapper mapper;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final UserPresenceService presenceService;

    public PersonalMentorAlumni getMentorshipSessions(Integer id) {
        Profile profile=repo.findById(id).orElseThrow(()-> new ResourceNotFoundException("profile not found"));
        return profile.getHumanMentor();
    }

    public List<QuizResult> getUserQuizzesResult(Integer id) {

        Profile profile=repo.findById(id).orElseThrow(()-> new ResourceNotFoundException("profile not found"));

        return profile.getQuizResults();
    }

    private final UserRepository userRepository;
    private final PersonalMentorAlumniRepo mentorRepo;

    public AuthResponse login(AuthRequest authRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(authRequest.getEmail(), authRequest.getPassword())
        );

        if (authentication.isAuthenticated()) {
            User user = userRepository.findByEmail(authRequest.getEmail())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            String token = jwtUtils.generateToken(user.getEmail());
            
            UserSummaryDto summary = new UserSummaryDto();
            summary.setEmail(user.getEmail());
            summary.setRole("ROLE_" + user.getRole().name());
            summary.setUserId(user.getId());

            if (user.getRole() == Role.STUDENT) {
                Profile profile = repo.findByUser(user)
                        .orElseThrow(() -> new ResourceNotFoundException("Profile details not found"));
                if (profile.getEmail() == null) {
                    profile.setEmail(user.getEmail());
                    repo.save(profile);
                }
                summary.setId(profile.getId());
                summary.setFullName(profile.getFullName());
                if (profile.getHumanMentor() != null) {
                    summary.setHumanMentorEmail(profile.getHumanMentor().getEmail());
                }
            } else if (user.getRole() == Role.MENTOR) {
                PersonalMentorAlumni mentor = mentorRepo.findByUser(user)
                        .orElseThrow(() -> new ResourceNotFoundException("Mentor details not found"));

                Profile profile = repo.findByUser(user).orElseGet(() -> {
                    Profile newProfile = Profile.builder()
                            .fullName(mentor.getName())
                            .email(user.getEmail())
                            .user(user)
                            .credit(1000)
                            .build();
                    return repo.save(newProfile);
                });

                if (mentor.getEmail() == null) {
                    mentor.setEmail(user.getEmail());
                    mentorRepo.save(mentor);
                }
                summary.setId(profile.getId());
                summary.setMentorId(mentor.getId());
                summary.setFullName(mentor.getName());
            }

            return new AuthResponse(token, summary);
        } else {
            throw new RuntimeException("Authentication failed");
        }
    }

    private ProfileDto convertToDto(Profile profile) {
        ProfileDto dto = mapper.map(profile, ProfileDto.class);
        if (profile.getUser() != null) {
            dto.setUserId(profile.getUser().getId());
            dto.setOnline(presenceService.isUserOnline(profile.getUser().getId()));
        }
        if (profile.getHumanMentor() != null && profile.getHumanMentor().getUser() != null) {
            dto.getHumanMentor().setOnline(presenceService.isUserOnline(profile.getHumanMentor().getUser().getId()));
            dto.getHumanMentor().setUserId(profile.getHumanMentor().getUser().getId());
        }
        return dto;
    }

    public ProfileDto getProfileById(Integer id) {
        Profile profile = repo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Profile not found"));
        return convertToDto(profile);
    }

    public ProfileDto getProfileByEmail(String email) {
        Profile profile = repo.findByEmail(email).orElseGet(() -> 
            repo.findByUserEmail(email).map(p -> {
                p.setEmail(email);
                return repo.save(p);
            }).orElseThrow(() -> new ResourceNotFoundException("Profile not found with email: " + email))
        );
        return convertToDto(profile);
    }


    public String signup(ProfileDto pdto) {
        User user = User.builder()
                .email(pdto.getEmail())
                .username(pdto.getEmail())
                .password(passwordEncoder.encode(pdto.getPassword()))
                .role(Role.STUDENT)
                .build();
        
        user = userRepository.save(user);

        Profile profile = mapper.map(pdto, Profile.class);
        profile.setCredit(500);
        profile.setUser(user);
        profile.setEmail(user.getEmail());

        repo.save(profile);

        // Send Welcome Email
        try {
           // emailService.sendEmail(user.getEmail(), "Welcome to AI Career Mentor",
             //   "Hi " + profile.getFullName() + ",\n\nWelcome to our platform! We've credited 500 points to your account to get you started.");
        } catch (Exception e) {

            System.err.println("Could not send welcome email: " + e.getMessage());
        }

        return "The profile created successfully";
    }

    public void addCredits(int profileId, int amount) {
        Profile profile = repo.findById(profileId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found"));
        profile.setCredit(profile.getCredit() + amount);
        repo.save(profile);

        // Create notification
       // nserv.saveNotification(profile, "Credits Added", "Successfully added " + amount + " credits to your account.");
    }

    public CourseRecommendation getCourseRecommendation(int id, FinalRoot root) throws JsonProcessingException {
        return aiservice.getCourseRecommendation(id,root);
    }

    public CourseRecommendation getCourseRecommendation(int id){
        Profile profile=repo.findById(id).orElseThrow(()-> new ResourceNotFoundException("profile not found"));

        return profile.getCourseRecommendations();
    }

    public List<College> getCollegeRecommendations(int id,String city){
        return aiservice.RecommendColleges(id,city);
    }

    public List<College> getCollege(int id){
        Profile profile=repo.findById(id).orElseThrow(()->new ResourceNotFoundException("profile not found"));
        return profile.getSavedColleges();
    }
}
