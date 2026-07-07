package com.walkwars.exception;

import com.walkwars.dto.response.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException ex) {
        log.warn("Validation error: {}", ex.getMessage());
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining("; "));
        return ResponseEntity.badRequest()
                .body(ApiResponse.validationFailed(message));
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusiness(BusinessException ex) {
        log.warn("Business exception: code={}, message={}", ex.getErrorCode(), ex.getMessage());
        HttpStatus status = mapErrorToStatus(ex.getErrorCode());
        return ResponseEntity.status(status)
                .body(ApiResponse.failure(ex.getMessage(), ex.getErrorCode()));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadCredentials(BadCredentialsException ex) {
        log.warn("Bad credentials: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.failure("Invalid credentials", "UNAUTHORIZED"));
    }

    @ExceptionHandler(UsernameNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleUserNotFound(UsernameNotFoundException ex) {
        log.warn("User not found exception: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.failure("Invalid credentials", "UNAUTHORIZED"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneric(Exception ex) {
        log.error("An unexpected exception occurred", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.failure("An unexpected error occurred", "SERVER_ERROR"));
    }

    private HttpStatus mapErrorToStatus(String errorCode) {
        switch (errorCode) {
            case "UNAUTHORIZED":
                return HttpStatus.UNAUTHORIZED;
            case "FORBIDDEN":
                return HttpStatus.FORBIDDEN;
            case "NOT_FOUND":
                return HttpStatus.NOT_FOUND;
            case "ACTIVE_WALK_EXISTS":
                return HttpStatus.CONFLICT;
            case "VALIDATION_ERROR":
            case "INSUFFICIENT_POINTS":
                return HttpStatus.BAD_REQUEST;
            default:
                return HttpStatus.BAD_REQUEST;
        }
    }
}
