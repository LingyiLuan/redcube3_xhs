<template>
  <div class="status-page">
    <LandingNav />
    <div class="status-container">
      <div class="status-content">
        <h1 class="status-title">System Status</h1>
        <p class="status-subtitle">Real-time status of LabZero services</p>

        <div class="status-overview">
          <div class="status-item">
            <div class="status-indicator operational"></div>
            <div class="status-info">
              <h3>All Systems Operational</h3>
              <p>All services are running normally</p>
            </div>
          </div>
        </div>

        <div class="status-services">
          <h2 class="services-title">Service Status</h2>
          <div class="service-list">
            <div class="service-item">
              <div class="service-name">API Gateway</div>
              <div class="service-status operational">Operational</div>
            </div>
            <div class="service-item">
              <div class="service-name">Content Service</div>
              <div class="service-status operational">Operational</div>
            </div>
            <div class="service-item">
              <div class="service-name">User Service</div>
              <div class="service-status operational">Operational</div>
            </div>
            <div class="service-item">
              <div class="service-name">Database</div>
              <div class="service-status operational">Operational</div>
            </div>
            <div class="service-item">
              <div class="service-name">Frontend</div>
              <div class="service-status operational">Operational</div>
            </div>
          </div>
        </div>

        <div class="status-updates">
          <h2 class="updates-title">Recent Updates</h2>
          <div class="update-item">
            <div class="update-date">November 29, 2025</div>
            <div class="update-content">
              <strong>All systems operational</strong>
              <p>All services are running normally with no known issues.</p>
            </div>
          </div>
        </div>

        <div class="status-footer">
          <p>
            For more information or to report an issue, contact us at
            <a href="mailto:lingyi.luan01@gmail.com">lingyi.luan01@gmail.com</a>
          </p>
        </div>
      </div>
    </div>
    <LandingFooter />
  </div>
</template>

<script setup>
import LandingNav from '@/components/Landing/LandingNav.vue'
import LandingFooter from '@/components/Landing/LandingFooter.vue'
</script>

<style scoped>
.status-page {
  min-height: 100vh;
  background: #FFFFFF;
  padding-top: 52px;
}

.status-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 64px 32px;
}

.status-content {
  font-family: 'Inter', sans-serif;
}

.status-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 42px;
  font-weight: 700;
  color: #000000;
  margin: 0 0 8px 0;
  letter-spacing: -1px;
}

.status-subtitle {
  font-size: 16px;
  color: #6B7280;
  margin: 0 0 48px 0;
}

.status-overview {
  margin-bottom: 48px;
  padding: 24px;
  background: #F9FAFB;
  border: 2px solid #E5E7EB;
  border-radius: 8px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-indicator {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-indicator.operational {
  background: #10B981;
}

.status-info h3 {
  font-size: 18px;
  font-weight: 600;
  color: #000000;
  margin: 0 0 4px 0;
}

.status-info p {
  font-size: 14px;
  color: #6B7280;
  margin: 0;
}

.status-services {
  margin-bottom: 48px;
}

.services-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: #000000;
  margin: 0 0 24px 0;
}

.service-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.service-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #F9FAFB;
  border: 2px solid #E5E7EB;
  border-radius: 8px;
}

.service-name {
  font-size: 16px;
  font-weight: 600;
  color: #000000;
}

.service-status {
  font-size: 14px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 4px;
}

.service-status.operational {
  background: #D1FAE5;
  color: #065F46;
}

.status-updates {
  margin-bottom: 48px;
}

.updates-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: #000000;
  margin: 0 0 24px 0;
}

.update-item {
  padding: 20px;
  background: #F9FAFB;
  border: 2px solid #E5E7EB;
  border-radius: 8px;
  margin-bottom: 16px;
}

.update-date {
  font-size: 12px;
  font-weight: 600;
  color: #6B7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.update-content strong {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #000000;
  margin-bottom: 8px;
}

.update-content p {
  font-size: 14px;
  color: #374151;
  margin: 0;
}

.status-footer {
  padding-top: 32px;
  border-top: 2px solid #E5E7EB;
  text-align: center;
}

.status-footer p {
  font-size: 14px;
  color: #6B7280;
  margin: 0;
}

.status-footer a {
  color: #1E3A8A;
  text-decoration: none;
}

.status-footer a:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .status-container {
    padding: 48px 20px;
  }

  .status-title {
    font-size: 32px;
  }

  .service-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>

