ARG SPLUNKFORWARDER_VERSION=10.4.0

FROM splunk/splunk:10.6.1.1 AS splunk
ENV SPLUNK_START_ARGS=--accept-license \
    SPLUNK_GENERAL_TERMS=--accept-sgt-current-at-splunk-com \
    SPLUNK_PASSWORD=password \
    SPLUNK_HOME_OWNERSHIP_ENFORCEMENT=false
USER root
RUN mkdir -p /opt/splunk/etc/apps /opt/splunk/var/log/client_events && \
    chown splunk:splunk /opt/splunk/etc/apps /opt/splunk/var/log /opt/splunk/var/log/client_events
COPY docker/splunk.yml /tmp/defaults/default.yml
USER ansible

FROM splunk/universalforwarder:${SPLUNKFORWARDER_VERSION} AS splunkforwarder
ARG GUID
ARG CLIENT_NAME
ARG INSTANCE_NAME
ENV SPLUNK_START_ARGS=--accept-license \
    SPLUNK_GENERAL_TERMS=--accept-sgt-current-at-splunk-com \
    SPLUNK_PASSWORD=password \
    CLIENT_NAME=${CLIENT_NAME} \
    INSTANCE_NAME=${INSTANCE_NAME}
USER splunk
RUN if [ -n "$GUID" ]; then printf '[general]\nguid = %s\n' "$GUID" > /opt/splunkforwarder-etc/instance.cfg; fi
USER ansible
COPY docker/splunkforwarder.yml /tmp/defaults/default.yml
