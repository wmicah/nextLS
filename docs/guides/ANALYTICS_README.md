# Analytics Dashboard

## Overview

The Analytics Dashboard provides coaches with comprehensive insights into their coaching business performance, client progress, and program effectiveness.

## Features

### 📊 Key Metrics

- **Active Clients**: Current number of active athletes
- **Average Progress**: Overall client progress across all programs
- **Completion Rate**: Percentage of programs completed successfully
- **Client Retention**: Rate of client retention over time

### 🎯 Goal Tracking

- **Performance Goals**: Set and track targets for key metrics
- **Progress Visualization**: Visual progress bars showing goal achievement
- **Status Indicators**: Color-coded status (achieved, on-track, needs attention)

### 📈 Time Range Analysis

- **Flexible Time Periods**: 7 days, 30 days, 90 days, 1 year
- **Trend Analysis**: Compare current period to previous period
- **Growth Indicators**: Visual trend arrows and percentage changes

### 👥 Client Progress Overview

- **Individual Client Performance**: Track each client's progress
- **Program Completion**: Number of programs completed per client
- **Trend Analysis**: Recent progress trends for each client

### 🏆 Program Performance

- **Program Effectiveness**: Which programs perform best
- **Completion Rates**: Success rates for each program
- **Active Client Count**: Number of clients using each program

### 📱 Engagement Metrics

- **Message Response Rate**: Communication effectiveness
- **Video Engagement**: Video content consumption rates
- **Workout Completion**: Exercise adherence rates

## Technical Implementation

### Backend (tRPC Procedures)

- `analytics.getDashboardData`: Main dashboard metrics and trends
- `analytics.getClientProgress`: Individual client progress data
- `analytics.getProgramPerformance`: Program effectiveness metrics
- `analytics.getEngagementMetrics`: Engagement and communication metrics

### Database Integration

- **Real-time Data**: All metrics calculated from actual database records
- **Client Filtering**: Only shows data for the authenticated coach
- **Archived Client Handling**: Excludes archived clients from active metrics
- **Progress Tracking**: Uses actual program assignment progress data

### Security

- **Role-based Access**: Only COACH users can access analytics
- **Data Isolation**: Coaches only see their own client data
- **Authentication Required**: Protected by Kinde authentication

## Data Sources

### Active Metrics

- **Clients**: `Client` table with `archived: false`
- **Programs**: `Program` table with coach association
- **Progress**: `ProgramAssignment` table with progress percentages
- **Engagement**: Various tables for messaging, videos, and workouts

### Trend Calculations

- **Period Comparison**: Current vs previous period analysis
- **Growth Rates**: Percentage change calculations
- **Real-time Updates**: Data refreshes automatically

## Usage

### For Coaches

1. Navigate to `/analytics` in the application
2. Select desired time range (7d, 30d, 90d, 1y)
3. Toggle goal tracking to set and monitor targets
4. Review client and program performance
5. Use insights to optimize coaching strategies

### For Stakeholders

- **Business Intelligence**: Understand coaching business performance
- **Client Success**: Track athlete progress and retention
- **Program Optimization**: Identify most effective training programs
- **Growth Metrics**: Monitor business growth and trends

## Future Enhancements

### Planned Features

- **Custom Goal Setting**: Allow coaches to set their own targets
- **PDF Reports**: Export analytics as professional reports
- **Email Alerts**: Notifications when goals are achieved/at risk
- **Advanced Charts**: Interactive charts and visualizations

### Advanced Analytics

- **Predictive Analytics**: Forecast client progress and retention
- **Benchmarking**: Compare to industry standards
- **Revenue Tracking**: Integrate with payment systems
- **AI Insights**: Automated recommendations and insights

## Demo Data

The system includes seeded test data for demonstration:

- 5 active clients with varying progress levels
- 3 different programs (Baseball, Softball, General Fitness)
- 5 program assignments with realistic progress percentages
- 1 archived client for testing archive functionality

## Access

- **URL**: `/analytics`
- **Role Required**: COACH
- **Authentication**: Required (Kinde)
- **Data Scope**: Coach's own clients and programs only
