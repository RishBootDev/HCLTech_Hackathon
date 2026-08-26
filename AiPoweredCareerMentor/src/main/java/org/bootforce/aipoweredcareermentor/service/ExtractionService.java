package org.bootforce.aipoweredcareermentor.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.hslf.usermodel.HSLFSlideShow;
import org.apache.poi.sl.extractor.SlideShowExtractor;
import org.apache.poi.xslf.usermodel.XMLSlideShow;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;

@Service
public class ExtractionService {

    public String extractText(MultipartFile file) throws IOException {
        String filename = file.getOriginalFilename();
        if (filename == null) {
            throw new IllegalArgumentException("Filename cannot be null");
        }

        String lowerCaseName = filename.toLowerCase();

        if (lowerCaseName.endsWith(".pdf")) {
            return extractFromPdf(file.getInputStream());
        } else if (lowerCaseName.endsWith(".ppt")) {
            return extractFromPpt(file.getInputStream());
        } else if (lowerCaseName.endsWith(".pptx")) {
            return extractFromPptx(file.getInputStream());
        } else {
            throw new IllegalArgumentException("Unsupported file type. Please upload PDF, PPT, or PPTX.");
        }
    }

    private String extractFromPdf(InputStream inputStream) throws IOException {
        try (PDDocument document = Loader.loadPDF(inputStream.readAllBytes())) {
            PDFTextStripper userStripper = new PDFTextStripper();
            userStripper.setSortByPosition(true);
            String text = userStripper.getText(document);
            return cleanText(text);
        }
    }

    private String extractFromPpt(InputStream inputStream) throws IOException {
        try (HSLFSlideShow ppt = new HSLFSlideShow(inputStream);
             SlideShowExtractor<?, ?> extractor = new SlideShowExtractor<>(ppt)) {
            extractor.setCommentsByDefault(false);
            extractor.setMasterByDefault(false);
            extractor.setNotesByDefault(false);
            return cleanText(extractor.getText());
        }
    }

    private String extractFromPptx(InputStream inputStream) throws IOException {
        try (XMLSlideShow pptx = new XMLSlideShow(inputStream);
             SlideShowExtractor<?, ?> extractor = new SlideShowExtractor<>(pptx)) {
            extractor.setCommentsByDefault(false);
            extractor.setMasterByDefault(false);
            extractor.setNotesByDefault(false);
            return cleanText(extractor.getText());
        }
    }

    private String cleanText(String text) {
        if (text == null)
            return "";
        String cleaned = text.replaceAll("\\n{3,}", "\n\n");
        return cleaned.trim();
    }
}
