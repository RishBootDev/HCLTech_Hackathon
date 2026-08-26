package org.bootforce.aipoweredcareermentor.model;


import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "colleges")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class College {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String collegeName;
    private String address;
    private String city;
    private String state;
    private String pincode;
    private String contact;
    private String email;
    private String course;
    private String facilities;

}
