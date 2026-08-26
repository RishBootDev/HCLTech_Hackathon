package org.bootforce.aipoweredcareermentor.controller;

import lombok.RequiredArgsConstructor;
import org.bootforce.aipoweredcareermentor.dto.Root;
import org.bootforce.aipoweredcareermentor.service.ResultService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/answer")
@RequiredArgsConstructor
@CrossOrigin
public class ResultController {

    private final ResultService serv;

    @PostMapping("/getResult/{id}")
    public Root getResult(@RequestBody Root root,@PathVariable int id) {
        return serv.result(root,id);
    }
}

