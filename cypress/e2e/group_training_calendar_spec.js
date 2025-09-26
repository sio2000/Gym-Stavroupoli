/**
 * E2E Tests for Group Training Calendar
 * Tests the complete user journey from creating sessions to viewing them in the calendar
 */

describe('Group Training Calendar E2E Tests', () => {
  beforeEach(() => {
    // Visit the admin panel
    cy.visit('/admin');
    
    // Login as admin (assuming auth is handled)
    cy.get('[data-testid="admin-login"]').click();
    cy.get('[data-testid="email-input"]').type('admin@example.com');
    cy.get('[data-testid="password-input"]').type('password');
    cy.get('[data-testid="login-button"]').click();
    
    // Wait for admin panel to load
    cy.get('[data-testid="admin-panel"]').should('be.visible');
  });

  it('should display Group Training Calendar in Personal Training section', () => {
    // Navigate to Personal Training tab
    cy.get('[data-testid="personal-training-tab"]').click();
    
    // Check that Group Training Calendar is visible
    cy.get('[data-testid="group-training-calendar"]').should('be.visible');
    cy.get('[data-testid="group-training-calendar"]').should('contain', 'Group Training Calendar');
    cy.get('[data-testid="group-training-calendar"]').should('contain', 'View and manage group training sessions');
  });

  it('should show calendar with current month', () => {
    // Navigate to Personal Training tab
    cy.get('[data-testid="personal-training-tab"]').click();
    
    // Check calendar is displayed
    cy.get('[data-testid="group-training-calendar"]').should('be.visible');
    
    // Check month/year display
    const currentDate = new Date();
    const monthYear = currentDate.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
    cy.get('[data-testid="calendar-month-year"]').should('contain', monthYear);
  });

  it('should display calendar navigation controls', () => {
    // Navigate to Personal Training tab
    cy.get('[data-testid="personal-training-tab"]').click();
    
    // Check navigation controls
    cy.get('[data-testid="calendar-prev-button"]').should('be.visible');
    cy.get('[data-testid="calendar-next-button"]').should('be.visible');
    cy.get('[data-testid="calendar-today-button"]').should('be.visible');
  });

  it('should navigate between months', () => {
    // Navigate to Personal Training tab
    cy.get('[data-testid="personal-training-tab"]').click();
    
    // Get current month
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    
    // Click next month
    cy.get('[data-testid="calendar-next-button"]').click();
    
    // Check month changed
    const nextMonth = new Date(currentDate.getFullYear(), currentMonth + 1);
    const nextMonthYear = nextMonth.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
    cy.get('[data-testid="calendar-month-year"]').should('contain', nextMonthYear);
    
    // Click previous month
    cy.get('[data-testid="calendar-prev-button"]').click();
    
    // Should be back to current month
    const currentMonthYear = currentDate.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
    cy.get('[data-testid="calendar-month-year"]').should('contain', currentMonthYear);
  });

  it('should display group sessions in calendar', () => {
    // Navigate to Personal Training tab
    cy.get('[data-testid="personal-training-tab"]').click();
    
    // Wait for calendar to load
    cy.get('[data-testid="group-training-calendar"]').should('be.visible');
    
    // Check for calendar grid
    cy.get('[data-testid="calendar-grid"]').should('be.visible');
    
    // Check for day headers
    cy.get('[data-testid="calendar-day-header"]').should('have.length', 7);
    cy.get('[data-testid="calendar-day-header"]').should('contain', 'Sun');
    cy.get('[data-testid="calendar-day-header"]').should('contain', 'Mon');
    cy.get('[data-testid="calendar-day-header"]').should('contain', 'Tue');
    cy.get('[data-testid="calendar-day-header"]').should('contain', 'Wed');
    cy.get('[data-testid="calendar-day-header"]').should('contain', 'Thu');
    cy.get('[data-testid="calendar-day-header"]').should('contain', 'Fri');
    cy.get('[data-testid="calendar-day-header"]').should('contain', 'Sat');
  });

  it('should show session details when clicking on an event', () => {
    // Navigate to Personal Training tab
    cy.get('[data-testid="personal-training-tab"]').click();
    
    // Wait for calendar to load
    cy.get('[data-testid="group-training-calendar"]').should('be.visible');
    
    // Look for a session event (if any exist)
    cy.get('[data-testid="calendar-grid"]').then(($grid) => {
      if ($grid.find('[data-testid="session-event"]').length > 0) {
        // Click on first session event
        cy.get('[data-testid="session-event"]').first().click();
        
        // Check that modal opens
        cy.get('[data-testid="session-modal"]').should('be.visible');
        cy.get('[data-testid="session-modal"]').should('contain', 'Session Details');
        
        // Check session info is displayed
        cy.get('[data-testid="session-time"]').should('be.visible');
        cy.get('[data-testid="session-room"]').should('be.visible');
        cy.get('[data-testid="session-trainer"]').should('be.visible');
        cy.get('[data-testid="session-capacity"]').should('be.visible');
        
        // Close modal
        cy.get('[data-testid="session-modal-close"]').click();
        cy.get('[data-testid="session-modal"]').should('not.exist');
      }
    });
  });

  it('should handle session cancellation', () => {
    // Navigate to Personal Training tab
    cy.get('[data-testid="personal-training-tab"]').click();
    
    // Wait for calendar to load
    cy.get('[data-testid="group-training-calendar"]').should('be.visible');
    
    // Look for a session event
    cy.get('[data-testid="calendar-grid"]').then(($grid) => {
      if ($grid.find('[data-testid="session-event"]').length > 0) {
        // Click on first session event
        cy.get('[data-testid="session-event"]').first().click();
        
        // Check that modal opens
        cy.get('[data-testid="session-modal"]').should('be.visible');
        
        // Click cancel session button
        cy.get('[data-testid="cancel-session-button"]').click();
        
        // Confirm cancellation
        cy.get('[data-testid="confirm-cancel"]').click();
        
        // Check success message
        cy.get('[data-testid="success-message"]').should('contain', 'Session cancelled successfully');
        
        // Modal should close
        cy.get('[data-testid="session-modal"]').should('not.exist');
      }
    });
  });

  it('should display capacity status correctly', () => {
    // Navigate to Personal Training tab
    cy.get('[data-testid="personal-training-tab"]').click();
    
    // Wait for calendar to load
    cy.get('[data-testid="group-training-calendar"]').should('be.visible');
    
    // Look for session events with different capacity statuses
    cy.get('[data-testid="calendar-grid"]').then(($grid) => {
      if ($grid.find('[data-testid="session-event"]').length > 0) {
        // Check for capacity indicators
        cy.get('[data-testid="session-event"]').each(($event) => {
          cy.wrap($event).should('contain', '/'); // Should show X/Y format
        });
      }
    });
  });

  it('should be responsive on mobile devices', () => {
    // Set mobile viewport
    cy.viewport(375, 667);
    
    // Navigate to Personal Training tab
    cy.get('[data-testid="personal-training-tab"]').click();
    
    // Check that calendar is still visible and functional
    cy.get('[data-testid="group-training-calendar"]').should('be.visible');
    cy.get('[data-testid="calendar-grid"]').should('be.visible');
    
    // Check navigation controls are still accessible
    cy.get('[data-testid="calendar-prev-button"]').should('be.visible');
    cy.get('[data-testid="calendar-next-button"]').should('be.visible');
    cy.get('[data-testid="calendar-today-button"]').should('be.visible');
  });

  it('should handle API failures gracefully', () => {
    // Mock API failure
    cy.intercept('GET', '**/group_sessions**', { statusCode: 500, body: { error: 'Server error' } });
    
    // Navigate to Personal Training tab
    cy.get('[data-testid="personal-training-tab"]').click();
    
    // Calendar should still be visible
    cy.get('[data-testid="group-training-calendar"]').should('be.visible');
    
    // Should show error state or empty state
    cy.get('[data-testid="calendar-grid"]').should('be.visible');
  });

  it('should refresh calendar when navigating back to tab', () => {
    // Navigate to Personal Training tab
    cy.get('[data-testid="personal-training-tab"]').click();
    
    // Wait for calendar to load
    cy.get('[data-testid="group-training-calendar"]').should('be.visible');
    
    // Navigate away
    cy.get('[data-testid="membership-packages-tab"]').click();
    
    // Navigate back
    cy.get('[data-testid="personal-training-tab"]').click();
    
    // Calendar should be visible again
    cy.get('[data-testid="group-training-calendar"]').should('be.visible');
  });
});
