package org.bootforce.aipoweredcareermentor.exception;


import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import java.util.Date;

import static org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<?> resourceNotFoundException(ResourceNotFoundException ex, WebRequest request){
        ErrorResponse errorDetails=new ErrorResponse(new Date(), HttpStatus.NOT_FOUND.value(),
                "Not found",
                ex.getMessage(),
                request.getDescription(false));

        return new ResponseEntity<>(errorDetails,HttpStatus.NOT_FOUND);
    }
    @ExceptionHandler(AiServiceException.class)
    public ResponseEntity<?> aiException(AiServiceException ex, WebRequest request){

        ErrorResponse errorResponse=new ErrorResponse(new Date(),HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Ai is giving problem",
                ex.getMessage(),
                request.getDescription(false));

        return new ResponseEntity<>(errorResponse,HttpStatus.EXPECTATION_FAILED);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> globalExceptionHandler(Exception ex, WebRequest request){
        ErrorResponse errorDetails=new ErrorResponse(new Date(), INTERNAL_SERVER_ERROR.value(),
                "Server Error",
                ex.getMessage(),
                request.getDescription(false));

        return new ResponseEntity<>(errorDetails, INTERNAL_SERVER_ERROR);
    }

}
