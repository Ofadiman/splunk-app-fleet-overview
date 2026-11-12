FROM splunk/splunk:10.6.1.1
USER root
RUN mkdir -p /opt/splunk/etc/apps && chown splunk:splunk /opt/splunk/etc/apps
USER ansible
