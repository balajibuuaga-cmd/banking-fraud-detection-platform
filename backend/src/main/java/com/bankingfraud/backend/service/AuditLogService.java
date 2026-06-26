package com.bankingfraud.backend.service;

import com.bankingfraud.backend.entity.AuditLog;
import com.bankingfraud.backend.repository.AuditLogRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public AuditLogService(
            AuditLogRepository auditLogRepository,
            SimpMessagingTemplate messagingTemplate) {

        this.auditLogRepository = auditLogRepository;
        this.messagingTemplate = messagingTemplate;
    }

    public void logAction(
            String action,
            String performedBy,
            String entityName,
            Long entityId) {

        AuditLog log = AuditLog.builder()
                .action(action)
                .performedBy(performedBy)
                .entityName(entityName)
                .entityId(entityId)
                .build();

        AuditLog savedLog = auditLogRepository.save(log);

        Map<String, Object> notification = new HashMap<>();
        notification.put("type", "AUDIT_EVENT");
        notification.put("action", savedLog.getAction());
        notification.put("performedBy", savedLog.getPerformedBy());
        notification.put("entityName", savedLog.getEntityName());
        notification.put("entityId", savedLog.getEntityId());
        notification.put("createdAt", savedLog.getCreatedAt());

        messagingTemplate.convertAndSend(
                "/topic/notifications",
                (Object) notification
        );
    }
}