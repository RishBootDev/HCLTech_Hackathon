package org.bootforce.aipoweredcareermentor.service;

import lombok.RequiredArgsConstructor;
import org.bootforce.aipoweredcareermentor.dto.PersonalMentorDto;
import org.bootforce.aipoweredcareermentor.exception.ResourceNotFoundException;
import org.bootforce.aipoweredcareermentor.model.PersonalMentorAlumni;
import org.bootforce.aipoweredcareermentor.model.Profile;
import org.bootforce.aipoweredcareermentor.enums.Role;
import org.bootforce.aipoweredcareermentor.model.User;
import org.bootforce.aipoweredcareermentor.repository.PersonalMentorAlumniRepo;
import org.bootforce.aipoweredcareermentor.repository.ProfileRepo;
import org.bootforce.aipoweredcareermentor.repository.UserRepository;
import org.modelmapper.ModelMapper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class PersonalMentorAlumniService {

    private final PersonalMentorAlumniRepo repo;
    private final ProfileRepo profileRepo;
    private final ModelMapper mapper;
    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final UserPresenceService presenceService;

    private PersonalMentorDto convertToDto(PersonalMentorAlumni mentor) {
        PersonalMentorDto dto = mapper.map(mentor, PersonalMentorDto.class);
        if (mentor.getUser() != null) {
            dto.setUserId(mentor.getUser().getId());
            dto.setOnline(presenceService.isUserOnline(mentor.getUser().getId()));
        }
        return dto;
    }

    public PersonalMentorDto registerMentor(PersonalMentorAlumni mentor) {
        if (userRepository.findByEmail(mentor.getUser().getEmail()).isPresent()) {
            throw new RuntimeException("Email already registered");
        }

        User user = mentor.getUser();
        user.setUsername(user.getEmail());
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setRole(Role.MENTOR);
        user = userRepository.save(user);
        
        mentor.setUser(user);
        mentor.setEmail(user.getEmail());
        PersonalMentorAlumni savedMentor = repo.save(mentor);
        return convertToDto(savedMentor);
    }

    public PersonalMentorDto login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }
        
        PersonalMentorAlumni mentor = repo.findByUser(user)
                .orElseThrow(() -> new ResourceNotFoundException("Mentor details not found"));
        
        return convertToDto(mentor);
    }

    public PersonalMentorDto getMentorDetails(int id) {
        PersonalMentorAlumni mentor = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mentor not found with id: " + id));
        return convertToDto(mentor);
    }

    public PersonalMentorDto getMentorDetailsByEmail(String email) {
        PersonalMentorAlumni mentor = repo.findByEmail(email).orElseGet(() -> 
            repo.findByUserEmail(email).map(m -> {
                m.setEmail(email);
                return repo.save(m);
            }).orElseThrow(() -> new ResourceNotFoundException("Mentor not found with email: " + email))
        );
        return convertToDto(mentor);
    }

    public List<PersonalMentorDto> getAllMentors() {
        return repo.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public List<PersonalMentorDto> getAvailableMentors() {
        return repo.findByAvailable(true).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public List<PersonalMentorDto> getMentorsByCourse(Integer courseId) {
        return repo.findByCourseId(courseId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public void assignStudentToMentor(int mentorId, int profileId) {
        PersonalMentorAlumni mentor = repo.findById(mentorId)
                .orElseThrow(() -> new ResourceNotFoundException("Mentor not found"));
        Profile student = profileRepo.findById(profileId)
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found"));

        if (student.getHumanMentor() != null && student.getHumanMentor().getId() == mentorId) {
            throw new RuntimeException("You are already subscribed to this mentor.");
        }

        if (student.getCredit() < mentor.getRequiredCredits()) {
            throw new RuntimeException("Insufficient credits to hire this mentor. Required: " 
                + mentor.getRequiredCredits() + ", Available: " + student.getCredit());
        }

        student.setCredit(student.getCredit() - mentor.getRequiredCredits());

        mentor.setCredits(mentor.getCredits() + mentor.getRequiredCredits());

        student.setHumanMentor(mentor);
        profileRepo.save(student);
        repo.save(mentor);
    }

    public List<org.bootforce.aipoweredcareermentor.dto.ProfileDto> getListOfStudents(int id) {
        PersonalMentorAlumni mentor = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mentor not found with id: " + id));
        return mentor.getStudents().stream()
                .map(s -> {
                    org.bootforce.aipoweredcareermentor.dto.ProfileDto pdto = mapper.map(s, org.bootforce.aipoweredcareermentor.dto.ProfileDto.class);
                    if (s.getUser() != null) {
                        pdto.setUserId(s.getUser().getId());
                        pdto.setOnline(presenceService.isUserOnline(s.getUser().getId()));
                    }
                    return pdto;
                })
                .collect(Collectors.toList());
    }

    public PersonalMentorDto updateMentorAvailability(int id, boolean available) {
        PersonalMentorAlumni mentor = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mentor not found"));
        mentor.setAvailable(available);
        return convertToDto(repo.save(mentor));
    }

    public PersonalMentorDto updateMentor(int id, PersonalMentorAlumni mentorDetails) {
        PersonalMentorAlumni mentor = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mentor not found"));
        
        mentor.setName(mentorDetails.getName());
        mentor.setPhone(mentorDetails.getPhone());
        mentor.setJobRole(mentorDetails.getJobRole());
        mentor.setSpecialization(mentorDetails.getSpecialization());
        mentor.setDescription(mentorDetails.getDescription());
        mentor.setRequiredCredits(mentorDetails.getRequiredCredits());
        mentor.setExperience(mentorDetails.getExperience());
        
        return convertToDto(repo.save(mentor));
    }
}
