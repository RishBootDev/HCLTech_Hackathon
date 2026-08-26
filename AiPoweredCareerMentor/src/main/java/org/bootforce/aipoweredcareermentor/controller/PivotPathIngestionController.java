package org.bootforce.aipoweredcareermentor.controller;

import org.bootforce.aipoweredcareermentor.service.PivotPathIngestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/ingestion")
@RequiredArgsConstructor
public class PivotPathIngestionController {

    private final PivotPathIngestionService ingestionService;

    @PostMapping("/upload")
    public String uploadResume(@RequestParam("file") MultipartFile file){
        ingestionService.ingestPdf(file.getResource(), "RESUME");
        return "Resume '" + file.getOriginalFilename() + "' has been processed and stored securely!";
    }

    @PostMapping("/admin/refresh-catalog")
    public String refreshCatalog(@RequestParam("file") MultipartFile file) {
        ingestionService.ingestLocalCourseCatalog(file.getResource());
        return "Local catalog re-indexed from uploaded file!";
    }
}
