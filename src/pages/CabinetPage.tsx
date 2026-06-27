import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCabinet } from '../context/CabinetContext';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../context/EventsContext';
import { theme } from '../styles/theme';
import { config } from '../config/env';
import type { SessionDto } from '../api/users/UsersContracts';
import type { BindEmailRequest, EndBindEmailRequest } from '../api/users/UsersContracts';
import ReCAPTCHA from 'react-google-recaptcha';

const captchaSiteKey = config.captchaSiteKey;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const isValidEmail = (email: string): boolean => {
  if (!email || email.trim() === '') return false;
  return emailRegex.test(email.trim());
};

export const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
};

export const formatDateTime = (dateString: string): string => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('ru-RU', { 
    day: 'numeric', month: 'long', year: 'numeric', 
    hour: '2-digit', minute: '2-digit' 
  });
};

export const getInitials = (name: string): string => {
  if (!name) return '?';
  const parts = name.split(' ');
  return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
};

export const addDays = (dateString: string, days: number): string => {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

export const isTimeOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
  const s1 = timeToMinutes(start1), e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2), e2 = timeToMinutes(end2);
  return s1 < e2 && s2 < e1;
};

export const assignEventLanes = (
  events: Array<{ id: string; startTime: string; endTime: string }>
): Array<{ id: string; lane: number }> => {
  const sorted = [...events].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  const lanes: Array<Array<{ id: string; startTime: string; endTime: string }>> = [];
  const result: Array<{ id: string; lane: number }> = [];

  for (const event of sorted) {
    let placed = false;
    for (let laneIdx = 0; laneIdx < lanes.length; laneIdx++) {
      const lastInLane = lanes[laneIdx][lanes[laneIdx].length - 1];
      if (!isTimeOverlap(event.startTime, event.endTime, lastInLane.startTime, lastInLane.endTime)) {
        lanes[laneIdx].push(event);
        result.push({ id: event.id, lane: laneIdx });
        placed = true;
        break;
      }
    }
    if (!placed) {
      lanes.push([event]);
      result.push({ id: event.id, lane: lanes.length - 1 });
    }
  }
  return result;
};

// === Стили ===
const createStyles = (theme: any, isMobile: boolean) => {
  const { colors, typography, spacing, borderRadius, shadows, transitions } = theme;
  
  return {
    container: { minHeight: '100%', padding: isMobile ? spacing.md : 0 } as React.CSSProperties,
    pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? spacing.lg : spacing.xl, paddingBottom: isMobile ? spacing.md : spacing.lg, borderBottom: `1px solid ${colors.gray200}`, flexWrap: 'wrap', gap: spacing.sm } as React.CSSProperties,
    pageTitle: { margin: 0, fontSize: isMobile ? typography.fontSize.xl : typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colors.gray900 } as React.CSSProperties,
    pageDesc: { margin: `${spacing.xs} 0 0 0`, fontSize: typography.fontSize.sm, color: colors.gray500 } as React.CSSProperties,
    layout: { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '280px 1fr', gap: isMobile ? spacing.lg : spacing.xl } as React.CSSProperties,
    sidebar: { position: isMobile ? 'fixed' : 'sticky', top: isMobile ? '0' : spacing.xl, height: isMobile ? '100vh' : 'fit-content', width: isMobile ? '280px' : '100%', backgroundColor: isMobile ? colors.white : 'transparent', zIndex: 1000, left: isMobile ? '0' : '0', transition: `left ${transitions.normal}`, overflowY: 'auto', padding: isMobile ? spacing.lg : 0, boxShadow: isMobile ? shadows.lg : 'none' } as React.CSSProperties,
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999, display: isMobile ? 'block' : 'none' } as React.CSSProperties,
    mobileHeader: { display: isMobile ? 'flex' : 'none', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, backgroundColor: colors.white, borderBottom: `1px solid ${colors.gray200}`, marginBottom: spacing.md } as React.CSSProperties,
    menuBtn: { background: 'transparent', border: 'none', cursor: 'pointer', padding: spacing.sm, display: 'flex', flexDirection: 'column', gap: '4px' } as React.CSSProperties,
    menuBar: { width: '24px', height: '2px', backgroundColor: colors.gray700, borderRadius: '2px' } as React.CSSProperties,
    profileCard: { backgroundColor: colors.white, borderRadius: borderRadius.lg, boxShadow: shadows.sm, border: `1px solid ${colors.gray200}`, padding: isMobile ? spacing.lg : spacing.xl, textAlign: 'center' as const } as React.CSSProperties,
    avatar: { width: isMobile ? '64px' : '80px', height: isMobile ? '64px' : '80px', borderRadius: borderRadius.full, backgroundColor: colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.white, fontWeight: typography.fontWeight.bold, fontSize: isMobile ? typography.fontSize.lg : typography.fontSize.xl, margin: '0 auto', marginBottom: spacing.md } as React.CSSProperties,
    profileName: { margin: 0, fontSize: isMobile ? typography.fontSize.base : typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: colors.gray900, wordBreak: 'break-word' as const } as React.CSSProperties,
    profileEmail: { margin: `${spacing.xs} 0 0 0`, fontSize: typography.fontSize.sm, color: colors.gray500, wordBreak: 'break-word' as const } as React.CSSProperties,
    profileMeta: { margin: `${spacing.md} 0 0 0`, paddingTop: spacing.md, borderTop: `1px solid ${colors.gray200}` } as React.CSSProperties,
    profileMetaItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${spacing.sm} 0`, fontSize: typography.fontSize.xs, color: colors.gray500, flexWrap: 'wrap', gap: spacing.xs } as React.CSSProperties,
    navMenu: { backgroundColor: colors.white, borderRadius: borderRadius.lg, boxShadow: shadows.sm, border: `1px solid ${colors.gray200}`, padding: spacing.md, marginTop: spacing.lg } as React.CSSProperties,
    contentArea: { minWidth: 0, width: '100%' } as React.CSSProperties,
    sectionCard: { backgroundColor: colors.white, borderRadius: borderRadius.lg, boxShadow: shadows.sm, border: `1px solid ${colors.gray200}`, overflow: 'hidden' } as React.CSSProperties,
    sectionHeader: { padding: isMobile ? spacing.md : `${spacing.lg} ${spacing.xl}`, borderBottom: `1px solid ${colors.gray200}`, backgroundColor: colors.gray50 } as React.CSSProperties,
    sectionTitle: { margin: 0, fontSize: isMobile ? typography.fontSize.base : typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: colors.gray900 } as React.CSSProperties,
    sectionDesc: { margin: `${spacing.xs} 0 0 0`, fontSize: typography.fontSize.sm, color: colors.gray500 } as React.CSSProperties,
    sectionBody: { padding: isMobile ? spacing.md : spacing.xl } as React.CSSProperties,
    errorText: { fontSize: typography.fontSize.xs, color: colors.error, marginTop: spacing.xs } as React.CSSProperties,
    buttonGroup: { display: 'flex', gap: spacing.sm, marginTop: spacing.xl, paddingTop: spacing.lg, borderTop: `1px solid ${colors.gray200}`, flexWrap: 'wrap' } as React.CSSProperties,
    statsGrid: { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: isMobile ? spacing.sm : spacing.md, marginBottom: spacing.xl } as React.CSSProperties,
    statCard: { backgroundColor: colors.gray50, borderRadius: borderRadius.md, padding: isMobile ? spacing.md : spacing.lg, border: `1px solid ${colors.gray200}` } as React.CSSProperties,
    statValue: { fontSize: isMobile ? typography.fontSize.xl : typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colors.primary, margin: 0, wordBreak: 'break-word' as const } as React.CSSProperties,
    statLabel: { fontSize: typography.fontSize.xs, color: colors.gray500, marginTop: spacing.xs, margin: 0 } as React.CSSProperties,
    securityItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${spacing.md} 0`, borderBottom: `1px solid ${colors.gray100}`, flexWrap: isMobile ? 'wrap' : 'nowrap', gap: spacing.sm } as React.CSSProperties,
    securityItemInfo: { flex: 1, minWidth: 0 } as React.CSSProperties,
    securityItemTitle: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colors.gray900, margin: 0 } as React.CSSProperties,
    securityItemDesc: { fontSize: typography.fontSize.xs, color: colors.gray500, marginTop: spacing.xs, margin: 0 } as React.CSSProperties,
    emptyState: { textAlign: 'center', padding: `${spacing['2xl']} ${spacing.xl}`, color: colors.gray500, fontSize: typography.fontSize.sm } as React.CSSProperties,
    table: { width: '100%', borderCollapse: 'collapse' as const, marginTop: spacing.lg, minWidth: '500px' } as React.CSSProperties,
    tableWrapper: { overflowX: 'auto', WebkitOverflowScrolling: 'touch' } as React.CSSProperties,
    tableHeader: { backgroundColor: colors.gray50, borderBottom: `2px solid ${colors.gray200}` } as React.CSSProperties,
    tableHeaderCell: { padding: `${spacing.sm} ${spacing.md}`, textAlign: 'left' as const, fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold, color: colors.gray600, textTransform: 'uppercase' as const, letterSpacing: '0.5px', whiteSpace: 'nowrap' as const } as React.CSSProperties,
    tableRow: { borderBottom: `1px solid ${colors.gray100}`, transition: `background-color ${transitions.fast}` } as React.CSSProperties,
    tableCell: { padding: `${spacing.md}`, fontSize: typography.fontSize.sm, color: colors.gray700, verticalAlign: 'middle' } as React.CSSProperties,
    sessionInfo: { display: 'flex', flexDirection: 'column' as const, gap: spacing.xs } as React.CSSProperties,
    sessionBrowser: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colors.gray900, wordBreak: 'break-word' as const } as React.CSSProperties,
    pagination: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.lg, paddingTop: spacing.lg, borderTop: `1px solid ${colors.gray200}`, flexWrap: isMobile ? 'wrap' : 'nowrap', gap: spacing.sm } as React.CSSProperties,
    paginationInfo: { fontSize: typography.fontSize.sm, color: colors.gray600 } as React.CSSProperties,
    paginationBtns: { display: 'flex', gap: spacing.sm } as React.CSSProperties,
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, animation: 'fadeIn 0.2s ease', padding: isMobile ? spacing.md : 0 } as React.CSSProperties,
    modalContent: { backgroundColor: colors.white, borderRadius: borderRadius.xl, boxShadow: shadows.xl, padding: isMobile ? spacing.lg : spacing.xl, maxWidth: isMobile ? '100%' : '420px', width: isMobile ? '100%' : '90%', animation: 'slideIn 0.2s ease', maxHeight: '90vh', overflowY: 'auto' } as React.CSSProperties,
    modalHeader: { display: 'flex', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg } as React.CSSProperties,
    modalIcon: { width: '48px', height: '48px', backgroundColor: colors.errorLight, borderRadius: borderRadius.full, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as React.CSSProperties,
    modalIconSvg: { width: '24px', height: '24px', color: colors.error } as React.CSSProperties,
    modalIconSuccess: { width: '48px', height: '48px', backgroundColor: colors.successLight, borderRadius: borderRadius.full, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as React.CSSProperties,
    modalIconSuccessSvg: { width: '24px', height: '24px', color: colors.success } as React.CSSProperties,
    modalTitle: { margin: 0, fontSize: isMobile ? typography.fontSize.base : typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: colors.gray900 } as React.CSSProperties,
    modalMessage: { fontSize: typography.fontSize.sm, color: colors.gray600, marginBottom: spacing.lg, lineHeight: 1.6 } as React.CSSProperties,
    modalSessionInfo: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.gray900, backgroundColor: colors.gray100, padding: `${spacing.sm} ${spacing.md}`, borderRadius: borderRadius.md, display: 'inline-block', marginBottom: spacing.lg, maxWidth: '100%', wordBreak: 'break-word' as const } as React.CSSProperties,
    modalActions: { display: 'flex', justifyContent: 'flex-end', gap: spacing.sm, flexWrap: isMobile ? 'wrap' : 'nowrap' } as React.CSSProperties,
    timelineWrapper: { 
      overflowX: 'auto', overflowY: 'auto', WebkitOverflowScrolling: 'touch', 
      scrollbarWidth: 'thin' as const, msOverflowStyle: 'none' as const,
      border: `1px solid ${colors.gray200}`, borderRadius: borderRadius.md,
      backgroundColor: colors.gray50, marginTop: spacing.lg, position: 'relative' as const
    } as React.CSSProperties,
    timelineContainer: { position: 'relative' as const, height: 'auto', minHeight: isMobile ? '120px' : '80px', minWidth: '1440px', overflow: 'visible' as const } as React.CSSProperties,
    timelineHours: { display: 'flex', height: '24px', borderBottom: `1px solid ${colors.gray200}`, backgroundColor: colors.white, position: 'sticky' as const, top: 0, zIndex: 10, minWidth: '1440px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' } as React.CSSProperties,
    timelineHourSlot: { flex: '0 0 60px', borderRight: `1px solid ${colors.gray100}`, fontSize: typography.fontSize.xxs, color: colors.gray500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 2px', boxSizing: 'border-box' } as React.CSSProperties,
    timelineEventsLayer: { position: 'absolute', top: '24px', left: 0, right: 0, bottom: 0, overflow: 'visible', minWidth: '1440px' } as React.CSSProperties,
    timelineEmpty: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: colors.gray500, fontSize: typography.fontSize.sm } as React.CSSProperties,
    scheduleControls: { display: 'flex', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg, flexWrap: 'wrap' } as React.CSSProperties,
    fieldBase: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colors.gray900, padding: `${spacing.sm} ${spacing.md}`, borderRadius: borderRadius.md, border: `1px solid ${colors.gray300}`, minHeight: '44px', display: 'flex', alignItems: 'center', boxSizing: 'border-box', width: '100%', margin: 0, lineHeight: 1.5, fontFamily: typography.fontFamily, backgroundColor: colors.white, transition: `all ${transitions.fast}` } as React.CSSProperties,
    fieldInput: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colors.gray900, padding: `${spacing.sm} ${spacing.md}`, borderRadius: borderRadius.md, border: `1px solid ${colors.gray300}`, minHeight: '44px', display: 'flex', alignItems: 'center', boxSizing: 'border-box', width: '100%', margin: 0, lineHeight: 1.5, fontFamily: typography.fontFamily, backgroundColor: colors.white, transition: `all ${transitions.fast}`, cursor: 'text', outline: 'none' } as React.CSSProperties,
    fieldError: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colors.gray900, padding: `${spacing.sm} ${spacing.md}`, borderRadius: borderRadius.md, border: `1px solid ${colors.error}`, minHeight: '44px', display: 'flex', alignItems: 'center', boxSizing: 'border-box', width: '100%', margin: 0, lineHeight: 1.5, fontFamily: typography.fontFamily, backgroundColor: colors.errorLight, transition: `all ${transitions.fast}`, cursor: 'text', outline: 'none' } as React.CSSProperties,
    fieldDisabled: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colors.gray500, padding: `${spacing.sm} ${spacing.md}`, borderRadius: borderRadius.md, border: `1px solid ${colors.gray300}`, minHeight: '44px', display: 'flex', alignItems: 'center', boxSizing: 'border-box', width: '100%', margin: 0, lineHeight: 1.5, fontFamily: typography.fontFamily, backgroundColor: colors.gray50, transition: `all ${transitions.fast}` } as React.CSSProperties,
    select: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colors.gray900, padding: `${spacing.sm} ${spacing.md}`, borderRadius: borderRadius.md, border: `1px solid ${colors.gray300}`, minHeight: '44px', display: 'flex', alignItems: 'center', boxSizing: 'border-box', width: '100%', margin: 0, lineHeight: 1.5, fontFamily: typography.fontFamily, backgroundColor: colors.white, transition: `all ${transitions.fast}`, cursor: 'pointer', appearance: 'none', backgroundImage: `url("image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='${colors.gray500}' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', outline: 'none' } as React.CSSProperties,
    btnPrimary: { padding: `${spacing.sm} ${spacing.lg}`, fontSize: typography.fontSize.sm, backgroundColor: colors.primary, color: colors.white, border: 'none', borderRadius: borderRadius.md, cursor: 'pointer', fontWeight: typography.fontWeight.medium, transition: `all ${transitions.normal}`, display: 'flex', alignItems: 'center', gap: spacing.xs, justifyContent: 'center', flex: isMobile ? '1' : 'auto' } as React.CSSProperties,
    btnDisabled: { padding: `${spacing.sm} ${spacing.lg}`, fontSize: typography.fontSize.sm, backgroundColor: colors.gray300, color: colors.white, border: 'none', borderRadius: borderRadius.md, cursor: 'not-allowed', fontWeight: typography.fontWeight.medium, transition: `all ${transitions.normal}`, display: 'flex', alignItems: 'center', gap: spacing.xs, justifyContent: 'center', flex: isMobile ? '1' : 'auto', opacity: 0.6 } as React.CSSProperties,
    btnSecondary: { padding: `${spacing.sm} ${spacing.lg}`, fontSize: typography.fontSize.sm, backgroundColor: 'transparent', color: colors.gray700, border: `1px solid ${colors.gray300}`, borderRadius: borderRadius.md, cursor: 'pointer', fontWeight: typography.fontWeight.medium, transition: `all ${transitions.normal}`, display: 'flex', alignItems: 'center', gap: spacing.xs, justifyContent: 'center', flex: isMobile ? '1' : 'auto' } as React.CSSProperties,
    btnDanger: { padding: `${spacing.sm} ${spacing.lg}`, fontSize: typography.fontSize.sm, backgroundColor: colors.error, color: colors.white, border: 'none', borderRadius: borderRadius.md, cursor: 'pointer', fontWeight: typography.fontWeight.medium, transition: `all ${transitions.normal}`, display: 'flex', alignItems: 'center', gap: spacing.xs, justifyContent: 'center', width: isMobile ? '100%' : 'auto' } as React.CSSProperties,
    btnTerminate: (disabled: boolean) => ({ padding: `${spacing.xs} ${spacing.sm}`, fontSize: typography.fontSize.xs, backgroundColor: disabled ? colors.gray200 : colors.error, color: disabled ? colors.gray400 : colors.white, border: 'none', borderRadius: borderRadius.md, cursor: disabled ? 'not-allowed' : 'pointer', fontWeight: typography.fontWeight.medium, transition: `all ${transitions.fast}`, opacity: disabled ? 0.6 : 1, outline: 'none', whiteSpace: 'nowrap' as const }),
    statusBadge: (active: boolean) => ({ padding: `${spacing.xs} ${spacing.sm}`, borderRadius: borderRadius.full, fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold, backgroundColor: active ? colors.successLight : colors.gray200, color: active ? colors.successDark : colors.gray600, whiteSpace: 'nowrap' as const }),
    timelineEvent: (start: string, end: string, color: string) => {
      const startMin = timeToMinutes(start), endMin = timeToMinutes(end);
      const duration = Math.max(endMin - startMin, 15);
      const left = (startMin / 1440) * 1440, width = Math.max((duration / 1440) * 1440, 30);
      return { position: 'absolute' as const, left: `${left}px`, width: `${width}px`, top: '8px', height: 'calc(100% - 16px)', backgroundColor: color, borderRadius: borderRadius.sm, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: `all ${transitions.fast}`, boxShadow: shadows.sm, overflow: 'hidden' };
    },
    timelineEventLabel: { fontSize: isMobile ? typography.fontSize.xxs : typography.fontSize.xs, fontWeight: typography.fontWeight.medium, color: colors.white, textAlign: 'center' as const, padding: '2px 4px', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' as const, maxWidth: '100%' } as React.CSSProperties,
    modalBtnCancel: { padding: `${spacing.sm} ${spacing.lg}`, backgroundColor: colors.white, color: colors.gray700, border: `1px solid ${colors.gray300}`, borderRadius: borderRadius.md, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, cursor: 'pointer', transition: `all ${transitions.normal}`, flex: isMobile ? '1' : 'auto', justifyContent: 'center' } as React.CSSProperties,
    modalBtnDelete: { padding: `${spacing.sm} ${spacing.lg}`, backgroundColor: colors.error, color: colors.white, border: 'none', borderRadius: borderRadius.md, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, cursor: 'pointer', transition: `all ${transitions.normal}`, flex: isMobile ? '1' : 'auto', justifyContent: 'center' } as React.CSSProperties,
    modalBtnPrimary: { padding: `${spacing.sm} ${spacing.lg}`, backgroundColor: colors.primary, color: colors.white, border: 'none', borderRadius: borderRadius.md, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, cursor: 'pointer', transition: `all ${transitions.normal}`, flex: isMobile ? '1' : 'auto', justifyContent: 'center' } as React.CSSProperties,
    navItem: (isActive: boolean) => ({
      display: 'flex', alignItems: 'center', gap: spacing.sm, padding: `${spacing.sm} ${spacing.md}`, borderRadius: borderRadius.md, cursor: 'pointer', fontSize: typography.fontSize.sm, fontWeight: isActive ? typography.fontWeight.semibold : typography.fontWeight.normal, color: isActive ? colors.primary : colors.gray600, backgroundColor: isActive ? colors.gray50 : 'transparent', transition: `all ${transitions.fast}`, border: 'none', width: '100%', textAlign: 'left' as const, marginBottom: spacing.xs,
    }),
    resendLink: { color: colors.primary, textDecoration: 'none', fontWeight: typography.fontWeight.medium, transition: `color ${transitions.fast}`, cursor: 'pointer', fontSize: typography.fontSize.xs } as React.CSSProperties,
  };
};

// === Иконки ===
const SecurityIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>);
const ActivityIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>);
const ScheduleIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>);

// === SecuritySection ===
const SecuritySection: React.FC<{ 
  styles: ReturnType<typeof createStyles>; 
  onChangePassword: () => void; 
  onChangeEmail: () => void;
  userInfo: any;
}> = ({ styles, onChangePassword, onChangeEmail, userInfo }) => (
  <div style={styles.sectionCard}>
    <div style={styles.sectionHeader}>
      <h2 style={styles.sectionTitle}>Безопасность</h2>
      <p style={styles.sectionDesc}>Настройки безопасности вашего аккаунта</p>
    </div>
    <div style={styles.sectionBody}>
      <div style={styles.securityItem}>
        <div style={styles.securityItemInfo}>
          <h4 style={styles.securityItemTitle}>Пароль</h4>
          <p style={styles.securityItemDesc}>Последний раз изменён {formatDate(userInfo?.passwordChangedDate || '')}</p>
        </div>
        <button onClick={onChangePassword} style={styles.btnSecondary}>Изменить</button>
      </div>
      <div style={styles.securityItem}>
        <div style={styles.securityItemInfo}>
          <h4 style={styles.securityItemTitle}>Email</h4>
          <p style={styles.securityItemDesc}>
            {userInfo?.email || 'Не указан'}
            {userInfo?.emailChangedDate && <><br/>Последний раз изменён {formatDate(userInfo.emailChangedDate)}</>}
          </p>
        </div>
        <button onClick={onChangeEmail} style={styles.btnSecondary}>Изменить</button>
      </div>
    </div>
  </div>
);

// === ActivitySection ===
const ActivitySection: React.FC<{
  sessions: SessionDto[]; sessionsLoading: boolean; sessionsError: string | null; currentPage: number; totalPages: number;
  canGoPrev: boolean; canGoNext: boolean; terminatingSessionId: string | null; currentLoginId: string | null;
  styles: ReturnType<typeof createStyles>; isMobile: boolean;
  onTerminateClick: (s: SessionDto) => void; onPageChange: (p: number) => void; onRetry: () => void;
  onTerminateAll: () => void;
}> = ({ sessions, sessionsLoading, sessionsError, currentPage, totalPages, canGoPrev, canGoNext, terminatingSessionId, currentLoginId, styles, isMobile, onTerminateClick, onPageChange, onRetry, onTerminateAll }) => {
  const isSessionActive = (s: SessionDto) => !s.isLogut && (!s.expiresAt || new Date(s.expiresAt) > new Date());
  const isCurrent = (s: SessionDto) => currentLoginId !== null && s.id === currentLoginId;
  
  return (
    <div style={styles.sectionCard}>
      <div style={styles.sectionHeader}><h2 style={styles.sectionTitle}>Активность</h2><p style={styles.sectionDesc}>История входов и активные сеансы</p></div>
      <div style={styles.sectionBody}>
        <div style={styles.statsGrid}>
          <div style={styles.statCard}><p style={styles.statValue}>{sessions.filter(isSessionActive).length}</p><p style={styles.statLabel}>Активных сеансов</p></div>
          <div style={styles.statCard}><p style={{...styles.statValue, fontSize: isMobile ? 18 : 24}}>{sessions.length > 0 ? formatDateTime(sessions[0].loginAt) : '—'}</p><p style={styles.statLabel}>Последний вход</p></div>
        </div>
        <div style={{ marginTop: 24 }}>
          {sessionsLoading ? <div style={styles.emptyState}><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" style={{animation:'spin 1s linear infinite',margin:'0 auto'}}><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10"/></svg><p style={{marginTop:12}}>Загрузка сеансов...</p></div> : sessionsError ? <div style={{...styles.emptyState,color:'#ef4444'}}><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" style={{margin:'0 auto'}}><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg><p style={{marginTop:12}}>{sessionsError}</p><button onClick={onRetry} style={{...styles.btnPrimary,marginTop:12}}>Попробовать снова</button></div> : sessions.length === 0 ? <div style={styles.emptyState}><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" style={{margin:'0 auto'}}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg><p style={{marginTop:12}}>Нет активных сеансов</p></div> : (
            <><div style={styles.tableWrapper}><table style={styles.table}><thead><tr style={styles.tableHeader}><th style={styles.tableHeaderCell}>Устройство</th><th style={styles.tableHeaderCell}>Вход</th><th style={styles.tableHeaderCell}>Действия</th></tr></thead><tbody>{sessions.map(session => { 
              const active = isSessionActive(session); 
              const current = isCurrent(session); 
              const disabled = terminatingSessionId === session.id || !active || current; 
              return (
                <tr key={session.id} style={{...styles.tableRow, backgroundColor: current ? '#dcfce7' : undefined}}>
                  <td style={styles.tableCell}>
                    <div style={styles.sessionInfo}>
                      <span style={styles.sessionBrowser}>{session.userAgent}</span>
                      {current && (
                        <span style={styles.statusBadge(true)}>Текущий сеанс</span>
                      )}
                    </div>
                  </td>
                  <td style={styles.tableCell}>{formatDateTime(session.loginAt)}</td>
                  <td style={styles.tableCell}>
                    <button 
                      onClick={() => onTerminateClick(session)} 
                      disabled={disabled} 
                      style={styles.btnTerminate(disabled)} 
                      title={!active ? "Сеанс уже завершен" : current ? "Нельзя завершить текущий сеанс" : "Завершить сеанс"}
                    >
                      {terminatingSessionId === session.id ? '...' : 'Завершить'}
                    </button>
                  </td>
                </tr>
              ); 
            })}</tbody></table></div>{totalPages > 1 && <div style={styles.pagination}><div style={styles.paginationInfo}>Страница {currentPage} из {totalPages}</div><div style={styles.paginationBtns}><button onClick={()=>onPageChange(currentPage-1)} disabled={!canGoPrev} style={!canGoPrev?styles.btnDisabled:styles.btnSecondary}>Назад</button><button onClick={()=>onPageChange(currentPage+1)} disabled={!canGoNext} style={!canGoNext?styles.btnDisabled:styles.btnSecondary}>Вперед</button></div></div>}
            {/* === Кнопка "Завершить все сеансы" перенесена сюда === */}
            {sessions.length > 0 && (
              <div style={{ marginTop: 24, paddingTop: 16, borderTop: `1px solid ${styles.sectionHeader.borderBottom?.toString().split(' ').pop()}` }}>
                <button 
                  onClick={onTerminateAll} 
                  style={styles.btnDanger}
                  disabled={sessionsLoading || terminatingSessionId !== null}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  Завершить все сеансы
                </button>
              </div>
            )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// === ScheduleSection ===
const ScheduleSection: React.FC<{ scheduleDate: string; scheduleEvents: Array<{id:string,title:string,startTime:string,endTime:string,color:string}>; eventsLoading: boolean; styles: ReturnType<typeof createStyles>; isMobile: boolean; onDateChange: (d: string) => void; }> = ({ scheduleDate, scheduleEvents, eventsLoading, styles, isMobile, onDateChange }) => {
  const lanesAssignment = useMemo(() => assignEventLanes(scheduleEvents.map(e => ({ id: e.id, startTime: e.startTime, endTime: e.endTime }))), [scheduleEvents]);
  const maxLane = Math.max(-1, ...lanesAssignment.map(a => a.lane));
  const laneCount = maxLane + 1;
  const laneHeight = 36;
  const timelineContentHeight = Math.max(60, laneCount * laneHeight + 8);
  const laneMap = useMemo(() => { const map = new Map<string, number>(); lanesAssignment.forEach(a => map.set(a.id, a.lane)); return map; }, [lanesAssignment]);

  return (
    <div style={styles.sectionCard}>
      <div style={styles.sectionHeader}><h2 style={styles.sectionTitle}>Расписание</h2><p style={styles.sectionDesc}>Встречи и события на выбранный день</p></div>
      <div style={styles.sectionBody}>
        <div style={styles.scheduleControls}>
          <button onClick={() => onDateChange(addDays(scheduleDate, -1))} style={styles.btnSecondary} title="Предыдущий день"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg></button>
          <span style={{ fontSize: isMobile ? 14 : 16, fontWeight: 500, color: styles.sectionTitle.color, minWidth: isMobile ? 120 : 160, textAlign: 'center' }}>{formatDate(scheduleDate)}</span>
          <button onClick={() => onDateChange(addDays(scheduleDate, 1))} style={styles.btnSecondary} title="Следующий день"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg></button>
          <button onClick={() => onDateChange(new Date().toISOString().split('T')[0])} style={{...styles.btnSecondary, fontSize: 12, padding: '4px 12px'}} title="Сегодня">Сегодня</button>
        </div>
        <div style={styles.timelineWrapper} className="timeline-scroll-container">
          <div style={{...styles.timelineContainer, height: `${timelineContentHeight + 24}px`}}>
            <div style={styles.timelineHours}>{Array.from({length:24}, (_,h) => (<div key={h} style={styles.timelineHourSlot}>{h.toString().padStart(2,'0')}:00</div>))}</div>
            <div style={styles.timelineEventsLayer}>
              {eventsLoading ? <div style={styles.timelineEmpty}>Загрузка...</div> : scheduleEvents.length === 0 ? <div style={styles.timelineEmpty}>Нет встреч на этот день</div> : scheduleEvents.map(ev => { const lane = laneMap.get(ev.id) ?? 0; return (<div key={ev.id} style={{...styles.timelineEvent(ev.startTime, ev.endTime, ev.color), top: `${lane * laneHeight}px`, height: `${laneHeight - 8}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: `all ${theme.transitions.fast}`, boxShadow: theme.shadows.sm, overflow: 'hidden', zIndex: 1}} className="timeline-event" title={`${ev.title}\n${ev.startTime} — ${ev.endTime}`}><span style={{...styles.timelineEventLabel, fontSize: isMobile ? 10 : 11, padding: '1px 4px'}}>{ev.title}</span></div>); })}
            </div>
          </div>
        </div>
        {scheduleEvents.length > 0 && (<div style={{marginTop: 24}}><h4 style={{...styles.sectionTitle, fontSize: 16, marginBottom: 12}}>Список встреч ({scheduleEvents.length})</h4><div style={{display: 'flex', flexDirection: 'column', gap: 8}}>{scheduleEvents.map(ev => (<div key={ev.id} style={{display: 'flex', alignItems: 'center', gap: 12, padding: 12, backgroundColor: '#f9fafb', borderRadius: 8, border: `1px solid #e5e7eb`}}><div style={{flex: 1, minWidth: 0}}><div style={{fontWeight: 500, color: '#111827'}}>{ev.title}</div><div style={{fontSize: 12, color: '#6b7280'}}>{ev.startTime} — {ev.endTime}</div></div></div>))}</div></div>)}
      </div>
    </div>
  );
};

// === Модалки терминации и смены пароля ===
const TerminateModal: React.FC<{isOpen:boolean,sessionInfo:any,onCancel:()=>void,onConfirm:()=>void,terminating:boolean,styles:any,isMobile:boolean}> = ({isOpen,sessionInfo,onCancel,onConfirm,terminating,styles}) => !isOpen ? null : (<div style={styles.modalOverlay} onClick={onCancel}><div style={styles.modalContent} onClick={(e)=>e.stopPropagation()}><div style={styles.modalHeader}><div style={styles.modalIcon}><svg style={styles.modalIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg></div><h3 style={styles.modalTitle}>Завершить сеанс?</h3></div><p style={styles.modalMessage}>Вы уверены, что хотите завершить этот сеанс? Пользователь будет вынужден войти в аккаунт снова.</p>{sessionInfo && <div style={styles.modalSessionInfo}>{sessionInfo.userAgent}<br/><span style={{fontWeight:400,color:'#6b7280'}}>Вход: {formatDateTime(sessionInfo.loginAt)}</span></div>}<div style={styles.modalActions}><button style={styles.modalBtnCancel} onClick={onCancel} disabled={terminating}>Отмена</button><button style={styles.modalBtnDelete} onClick={onConfirm} disabled={terminating}>{terminating?'Завершение...':'Завершить'}</button></div></div></div>);

const TerminateAllModal: React.FC<{isOpen:boolean,sessionsCount:number,onCancel:()=>void,onConfirm:()=>void,styles:any}> = ({isOpen,sessionsCount,onCancel,onConfirm,styles}) => !isOpen ? null : (<div style={styles.modalOverlay} onClick={onCancel}><div style={styles.modalContent} onClick={(e)=>e.stopPropagation()}><div style={styles.modalHeader}><div style={styles.modalIcon}><svg style={styles.modalIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg></div><h3 style={styles.modalTitle}>Завершить все сеансы?</h3></div><p style={styles.modalMessage}>Вы уверены, что хотите завершить все активные сеансы? Вам и всем другим пользователям придётся войти в аккаунт снова.</p><div style={styles.modalSessionInfo}>Будет завершено сеансов: {sessionsCount}<br/><span style={{fontWeight:400,color:'#6b7280'}}>Включая текущий сеанс</span></div><div style={styles.modalActions}><button style={styles.modalBtnCancel} onClick={onCancel}>Отмена</button><button style={styles.modalBtnDelete} onClick={onConfirm}>Завершить все</button></div></div></div>);

const ChangePasswordModal: React.FC<{modal:any,isChanging:boolean,onChange:(f:any,v:string)=>void,onSubmit:()=>void,onCancel:()=>void,styles:any,validate:(p:string)=>string}> = ({modal,isChanging,onChange,onSubmit,onCancel,styles}) => !modal.isOpen ? null : (<div style={styles.modalOverlay} onClick={onCancel}><div style={styles.modalContent} onClick={(e)=>e.stopPropagation()}><div style={styles.modalHeader}><div style={styles.modalIconSuccess}><svg style={styles.modalIconSuccessSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg></div><h3 style={styles.modalTitle}>Смена пароля</h3></div>{modal.generalError && <div style={{...styles.errorText,marginBottom:16,padding:8,backgroundColor:'#fef2f2',borderRadius:8}}>{modal.generalError}</div>}<div style={{marginBottom:16}}><label style={styles.infoLabel}>Текущий пароль</label><input type="password" value={modal.currentPassword} onChange={(e)=>onChange('currentPassword',e.target.value)} placeholder="Введите текущий пароль" style={modal.currentPasswordError?styles.fieldError:styles.fieldInput} disabled={isChanging} onFocus={(e)=>{e.currentTarget.style.outline='none';e.currentTarget.style.borderColor=modal.currentPasswordError?'#ef4444':'#3b82f6';}} onBlur={(e)=>{e.currentTarget.style.borderColor=modal.currentPasswordError?'#ef4444':'#d1d5db';}}/>{modal.currentPasswordError && <div style={styles.errorText}>{modal.currentPasswordError}</div>}</div><div style={{marginBottom:16}}><label style={styles.infoLabel}>Новый пароль</label><input type="password" value={modal.newPassword} onChange={(e)=>onChange('newPassword',e.target.value)} placeholder="Введите новый пароль" style={modal.newPasswordError?styles.fieldError:styles.fieldInput} disabled={isChanging} onFocus={(e)=>{e.currentTarget.style.outline='none';e.currentTarget.style.borderColor=modal.newPasswordError?'#ef4444':'#3b82f6';}} onBlur={(e)=>{e.currentTarget.style.borderColor=modal.newPasswordError?'#ef4444':'#d1d5db';}}/>{modal.newPasswordError && <div style={styles.errorText}>{modal.newPasswordError}</div>}<div style={{fontSize:12,color:'#6b7280',marginTop:4}}>Минимум 8 символов, заглавная и строчная буквы, цифра</div></div><div style={{marginBottom:24}}><label style={styles.infoLabel}>Подтверждение нового пароля</label><input type="password" value={modal.confirmPassword} onChange={(e)=>onChange('confirmPassword',e.target.value)} placeholder="Повторите новый пароль" style={modal.confirmPasswordError?styles.fieldError:styles.fieldInput} disabled={isChanging} onFocus={(e)=>{e.currentTarget.style.outline='none';e.currentTarget.style.borderColor=modal.confirmPasswordError?'#ef4444':'#3b82f6';}} onBlur={(e)=>{e.currentTarget.style.borderColor=modal.confirmPasswordError?'#ef4444':'#d1d5db';}}/>{modal.confirmPasswordError && <div style={styles.errorText}>{modal.confirmPasswordError}</div>}</div><div style={styles.modalActions}><button style={styles.modalBtnCancel} onClick={onCancel} disabled={isChanging}>Отмена</button><button style={styles.modalBtnPrimary} onClick={onSubmit} disabled={isChanging}>{isChanging?'Сохранение...':'Сохранить'}</button></div></div></div>);

// === Модалка смены почты ===
type ChangeEmailStep = 'initial' | 'code' | 'success';

const ChangeEmailModal: React.FC<{
  isOpen: boolean; 
  step: ChangeEmailStep; 
  newEmail: string; 
  verificationCode: string; 
  currentPassword: string;
  error: string; 
  isSubmitting: boolean; 
  resendTimer: number; 
  styles: any; 
  isMobile: boolean;
  onNewEmailChange: (v: string) => void; 
  onPasswordChange: (v: string) => void; 
  onCodeChange: (v: string) => void;
  onSubmit: () => void;
  onCancel: () => void; 
  onResendCode: () => void; 
  onStepBack: () => void;
  captchaToken: string | null;
  setCaptchaToken: (t: string | null) => void;
  captchaRef: React.RefObject<ReCAPTCHA | null>;
}> = ({ isOpen, step, newEmail, verificationCode, currentPassword, error, isSubmitting, resendTimer, styles, onNewEmailChange, onPasswordChange, onCodeChange, onSubmit, onCancel, onResendCode, onStepBack, captchaToken, setCaptchaToken, captchaRef }) => {
  if (!isOpen) return null;
  const { colors, typography, spacing } = theme;

  return (
  <div style={styles.modalOverlay} onClick={onCancel}>
    <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
      <div style={styles.modalHeader}>
        <div style={step === 'success' ? styles.modalIconSuccess : styles.modalIcon}>
          <svg style={step === 'success' ? styles.modalIconSuccessSvg : styles.modalIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {step === 'success' ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>}
          </svg>
        </div>
        <h3 style={styles.modalTitle}>{step === 'initial' ? 'Смена почты' : step === 'code' ? 'Код подтверждения' : 'Готово!'}</h3>
      </div>
      {error && <div style={{...styles.errorText, marginBottom: 16, padding: 8, backgroundColor: '#fef2f2', borderRadius: 8}}>⚠️ {error}</div>}
      
      {step === 'success' ? (
        <><p style={styles.modalMessage}>✅ Почта успешно изменена на <strong>{newEmail}</strong></p>
        <div style={styles.modalActions}><button style={styles.modalBtnPrimary} onClick={onCancel}>Закрыть</button></div></>
      ) : step === 'code' ? (
        <><p style={styles.modalMessage}>Введите 6-значный код из письма на <strong>{newEmail}</strong></p>
        <div style={{ marginBottom: 16 }}><label style={styles.infoLabel}>Код подтверждения</label>
        <input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6} value={verificationCode} onChange={(e) => onCodeChange(e.target.value.replace(/\D/g, ''))} disabled={isSubmitting} style={{...styles.fieldInput, textAlign: 'center', fontSize: typography.fontSize.xl, letterSpacing: '8px', maxWidth: '200px', margin: '0 auto', display: 'block'}} placeholder="000000" onFocus={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#3b82f6'; }} onBlur={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; }} /></div>
        <div style={{ textAlign: 'center', marginBottom: 24 }}><span style={{ fontSize: typography.fontSize.xs, color: colors.gray500 }}>Не получили код?{' '}{resendTimer > 0 ? <span style={{ color: colors.gray400 }}>Отправить через {Math.ceil(resendTimer / 60)}:{(resendTimer % 60).toString().padStart(2, '0')}</span> : <span style={styles.resendLink} onClick={onResendCode}>Отправить повторно</span>}</span></div>
        <div style={styles.modalActions}>
          <button style={styles.modalBtnCancel} onClick={onStepBack} disabled={isSubmitting}>Назад</button>
          <button style={styles.modalBtnPrimary} onClick={onSubmit} disabled={isSubmitting || verificationCode.length !== 6}>
            {isSubmitting ? 'Проверка...' : 'Подтвердить'}
          </button>
        </div></>
      ) : (
        <><p style={styles.modalMessage}>Для смены почты введите текущий пароль и новую почту</p>
        <div style={{ marginBottom: 16 }}><label style={styles.infoLabel}>Текущий пароль</label><input type="password" value={currentPassword} onChange={(e) => onPasswordChange(e.target.value)} disabled={isSubmitting} placeholder="Введите пароль от аккаунта" style={styles.fieldInput} onFocus={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#3b82f6'; }} onBlur={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; }} /></div>
        <div style={{ marginBottom: spacing.md }}>
          <label style={styles.infoLabel}>Новая почта</label>
          <input 
            type="email" 
            value={newEmail} 
            onChange={(e) => onNewEmailChange(e.target.value)} 
            disabled={isSubmitting} 
            placeholder="example@mail.com" 
            style={newEmail && !isValidEmail(newEmail) ? styles.fieldError : styles.fieldInput} 
            onFocus={(e) => { 
              e.currentTarget.style.outline = 'none'; 
              e.currentTarget.style.borderColor = (newEmail && !isValidEmail(newEmail)) ? '#ef4444' : '#3b82f6'; 
            }} 
            onBlur={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; }} 
          />
          {newEmail && !isValidEmail(newEmail) && <div style={styles.errorText}>Введите корректный email адрес</div>}
        </div>
        
        {/* === CAPTCHA === */}
        <div style={{ 
          marginBottom: spacing.lg, 
          display: 'flex', 
          justifyContent: 'center',
          opacity: isSubmitting ? 0.6 : 1,
          pointerEvents: isSubmitting ? 'none' : 'auto'
        }}>
          <ReCAPTCHA
            ref={captchaRef}
            sitekey={captchaSiteKey || ''}
            onChange={setCaptchaToken}
            onExpired={() => setCaptchaToken(null)}
            onErrored={() => {
              // Обработчик ошибки загрузки капчи
            }}
            size="normal"
            theme="light"
            tabIndex={0}
          />
        </div>
        
        {!captchaToken && error?.includes('робот') && (
          <div style={{ ...styles.errorText, textAlign: 'center', marginBottom: spacing.sm }}>
            ⚠️ Пожалуйста, пройдите проверку безопасности
          </div>
        )}
        
        <div style={styles.modalActions}>
          <button style={styles.modalBtnCancel} onClick={onCancel} disabled={isSubmitting}>Отмена</button>
          <button 
            style={styles.modalBtnPrimary} 
            onClick={onSubmit} 
            disabled={isSubmitting || !isValidEmail(newEmail) || !currentPassword || !captchaToken}
          >
            {isSubmitting ? 'Отправка...' : 'Отправить код'}
          </button>
        </div></>
      )}
    </div>
  </div>
);
};

// === Типы ===
type SectionType = 'security' | 'activity' | 'schedule';

// === Основной компонент ===
export const CabinetPage = () => {
  const { isLoading, getUserSessions, currentLoginId, terminateSession, changePassword } = useCabinet();
  const { user: authUser, bindEmail, endBindEmail, updateUserEmail } = useAuth();
  const { getEventsForDate, isLoading: eventsLoading } = useEvents();
  const navigate = useNavigate();
  const themeData = theme;
  const UNIFORM_EVENT_COLOR = themeData.colors.primary;

  const [activeSection, setActiveSection] = useState<SectionType>('security');
  const [sessions, setSessions] = useState<SessionDto[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [totalSessions, setTotalSessions] = useState(0);
  const [terminatingSessionId, setTerminatingSessionId] = useState<string | null>(null);
  const [terminateModal, setTerminateModal] = useState({ isOpen: false, sessionId: null as string | null, sessionInfo: null as any });
  const [terminateAllModal, setTerminateAllModal] = useState({ isOpen: false });
  const [changePasswordModal, setChangePasswordModal] = useState({ isOpen: false, currentPassword: '', newPassword: '', confirmPassword: '', currentPasswordError: '', newPasswordError: '', confirmPasswordError: '', generalError: '' });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduleEvents, setScheduleEvents] = useState<Array<{id:string,title:string,startTime:string,endTime:string,color:string}>>([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Состояние смены почты
  const [changeEmailModal, setChangeEmailModal] = useState({
    isOpen: false, 
    step: 'initial' as ChangeEmailStep, 
    newEmail: '', 
    verificationCode: '', 
    currentPassword: '',
    verificationId: null as string | null,
    error: '', 
    isSubmitting: false, 
    resendTimer: 0
  });

  // === CAPTCHA для смены почты ===
  const [changeEmailCaptchaToken, setChangeEmailCaptchaToken] = useState<string | null>(null);
  const changeEmailCaptchaRef = useRef<ReCAPTCHA>(null);

  const styles = useMemo(() => createStyles(themeData, isMobile), [isMobile]);

  useEffect(() => { const handleResize = () => { const m = window.innerWidth < 768; setIsMobile(m); if (!m) setIsSidebarOpen(true); }; handleResize(); window.addEventListener('resize', handleResize); return () => window.removeEventListener('resize', handleResize); }, []);
  useEffect(() => { if (activeSection === 'schedule') { const events = getEventsForDate(scheduleDate); setScheduleEvents(events.map(e => ({ id: e.id, title: e.title, startTime: e.startTime, endTime: e.endTime, color: UNIFORM_EVENT_COLOR }))); } if (activeSection === 'activity') loadSessions(currentPage); if (isMobile) setIsSidebarOpen(false); }, [activeSection, currentPage, scheduleDate]);

  // Таймер resend
  useEffect(() => { if (changeEmailModal.resendTimer > 0) { const t = setTimeout(() => setChangeEmailModal(p => ({ ...p, resendTimer: p.resendTimer - 1 })), 1000); return () => clearTimeout(t); } }, [changeEmailModal.resendTimer]);

  // Сброс капчи при закрытии модалки или смене шага
  useEffect(() => {
    if (!changeEmailModal.isOpen || changeEmailModal.step !== 'initial') {
      setChangeEmailCaptchaToken(null);
      changeEmailCaptchaRef.current?.reset();
    }
  }, [changeEmailModal.isOpen, changeEmailModal.step]);

  const loadSessions = async (page: number) => { setSessionsLoading(true); setSessionsError(null); try { const r = await getUserSessions(10, page, false); setSessions(r.logins || []); setTotalSessions(r.totalCount || 0); } catch { setSessionsError('Не удалось загрузить данные о сессиях'); } finally { setSessionsLoading(false); } };

  const handleTerminateClick = (s: SessionDto) => setTerminateModal({ isOpen: true, sessionId: s.id, sessionInfo: { loginAt: s.loginAt, userAgent: s.userAgent } });
  const handleTerminateCancel = () => setTerminateModal({ isOpen: false, sessionId: null, sessionInfo: null });
  const handleTerminateConfirm = async () => { if (!terminateModal.sessionId) return; setTerminatingSessionId(terminateModal.sessionId); try { await terminateSession(terminateModal.sessionId); setSessions(p => p.filter(s => s.id !== terminateModal.sessionId)); setTotalSessions(p => Math.max(0, p - 1)); handleTerminateCancel(); } catch { setSessionsError('Не удалось завершить сеанс'); } finally { setTerminatingSessionId(null); } };
  const handleTerminateAllClick = () => setTerminateAllModal({ isOpen: true });
  const handleTerminateAllCancel = () => setTerminateAllModal({ isOpen: false });
  const terminateAllSessions = async () => { setTerminateAllModal({ isOpen: false }); try { for (const s of sessions.filter(s => s.id !== currentLoginId)) try { await terminateSession(s.id); } catch {} if (currentLoginId) try { await terminateSession(currentLoginId); } catch {} setSessions([]); setTotalSessions(0); navigate('/sign-in', { state: { message: 'Все сеансы завершены. Войдите снова.' } }); } catch { setSessionsError('Не удалось завершить все сеансы'); loadSessions(currentPage); } };

  const handleChangePasswordClick = () => setChangePasswordModal({ isOpen: true, currentPassword: '', newPassword: '', confirmPassword: '', currentPasswordError: '', newPasswordError: '', confirmPasswordError: '', generalError: '' });
  const handlePasswordModalCancel = () => setChangePasswordModal({ isOpen: false, currentPassword: '', newPassword: '', confirmPassword: '', currentPasswordError: '', newPasswordError: '', confirmPasswordError: '', generalError: '' });
  const validatePassword = (p: string) => { if (!p) return ''; if (p.length < 8) return 'Минимум 8 символов'; if (!/[A-Z]/.test(p)) return 'Должна быть заглавная буква'; if (!/[a-z]/.test(p)) return 'Должна быть строчная буква'; if (!/[0-9]/.test(p)) return 'Должна быть цифра'; return ''; };
  const handlePasswordChange = (field: any, value: string) => setChangePasswordModal(prev => { const upd: any = { [field]: value }; if (field === 'newPassword') { upd.newPasswordError = validatePassword(value); if (prev.confirmPassword && value !== prev.confirmPassword) upd.confirmPasswordError = 'Пароли не совпадают'; else if (prev.confirmPassword) upd.confirmPasswordError = ''; } if (field === 'confirmPassword') upd.confirmPasswordError = value !== prev.newPassword ? 'Пароли не совпадают' : ''; return { ...prev, ...upd }; });
  const handlePasswordSubmit = async () => { const { currentPassword, newPassword, confirmPassword } = changePasswordModal; const errors: any = { currentPasswordError: '', newPasswordError: '', confirmPasswordError: '', generalError: '' }; if (!currentPassword) errors.currentPasswordError = 'Введите текущий пароль'; if (!newPassword) errors.newPasswordError = 'Введите новый пароль'; else { const v = validatePassword(newPassword); if (v) errors.newPasswordError = v; } if (!confirmPassword) errors.confirmPasswordError = 'Подтвердите новый пароль'; else if (newPassword !== confirmPassword) errors.confirmPasswordError = 'Пароли не совпадают'; if (errors.currentPasswordError || errors.newPasswordError || errors.confirmPasswordError) { setChangePasswordModal(p => ({ ...p, ...errors })); return; } setIsChangingPassword(true); try { await changePassword(currentPassword, newPassword, confirmPassword); handlePasswordModalCancel(); } catch (e: any) { setChangePasswordModal(p => ({ ...p, generalError: e?.message || 'Не удалось сменить пароль' })); } finally { setIsChangingPassword(false); } };

  const totalPages = Math.ceil(totalSessions / 10);
  const canGoPrev = currentPage > 1, canGoNext = currentPage < totalPages;
  const handlePageChange = (p: number) => { if (p >= 1 && p <= totalPages) setCurrentPage(p); };

  // === Смена почты ===
  const handleChangeEmailClick = () => setChangeEmailModal({ isOpen: true, step: 'initial', newEmail: '', verificationCode: '', currentPassword: '', verificationId: null, error: '', isSubmitting: false, resendTimer: 0 });
  
  const handleEmailModalCancel = () => setChangeEmailModal(p => ({ 
    ...p, 
    isOpen: false,
    verificationId: null
  }));
  
  const handleEmailModalChange = (field: 'newEmail' | 'currentPassword' | 'verificationCode', value: string) => setChangeEmailModal(p => ({ ...p, [field]: value, error: '' }));
  
  const handleEmailStepBack = () => {
    setChangeEmailCaptchaToken(null);
    changeEmailCaptchaRef.current?.reset();
    setChangeEmailModal(p => ({ 
      ...p, 
      step: 'initial', 
      verificationCode: '', 
      verificationId: null,
      error: '' 
    }));
  };

  const handleSendVerificationCode = async () => {
    const { newEmail, currentPassword } = changeEmailModal;
    if (!isValidEmail(newEmail)) { setChangeEmailModal(p => ({ ...p, error: 'Введите корректный email адрес' })); return; }
    if (!currentPassword) { setChangeEmailModal(p => ({ ...p, error: 'Введите текущий пароль' })); return; }
    
    // === Валидация CAPTCHA ===
    if (!changeEmailCaptchaToken) { 
      setChangeEmailModal(p => ({ ...p, error: 'Пожалуйста, подтвердите, что вы не робот' })); 
      return; 
    }
    
    setChangeEmailModal(p => ({ ...p, isSubmitting: true, error: '' }));
    
    try {
      const request: BindEmailRequest = { newEmail, accountPassword: currentPassword, captchaToken: changeEmailCaptchaToken };
      const response = await bindEmail(request);
      
      setChangeEmailModal(p => ({ 
        ...p, 
        step: 'code', 
        verificationId: response.verificationId,
        isSubmitting: false, 
        resendTimer: 180 
      }));
      
      // Сброс капчи после успешной отправки
      setChangeEmailCaptchaToken(null);
      changeEmailCaptchaRef.current?.reset();
      
    } catch (err: any) {
      // Сброс капчи при ошибке 400 (валидация)
      if (err?.statusCode === 400) {
        setChangeEmailCaptchaToken(null);
        changeEmailCaptchaRef.current?.reset();
      }
      
      const sc = err?.statusCode || err?.status || 500;
      let msg = 'Произошла ошибка. Попробуйте снова.';
      if (sc === 400) msg = 'Ошибка валидации. Проверьте данные.';
      else if (sc === 403) msg = 'Неверный пароль от аккаунта.';
      else if (sc === 429) { msg = 'Слишком много запросов. Подождите.'; setChangeEmailModal(p => ({ ...p, resendTimer: 180 })); }
      else if (sc === 423) { msg = 'Менять почту можно не чаще чем раз в 30 дней.'; }
      else if (sc === 409) msg = 'Почта уже занята.';
      else if (sc >= 500) msg = 'Ошибка сервера. Попробуйте позже.';
      setChangeEmailModal(p => ({ ...p, error: msg, isSubmitting: false }));
    }
  };

  const handleResendEmailCode = async () => { 
    if (changeEmailModal.resendTimer === 0) {
      if (!changeEmailCaptchaToken) {
        setChangeEmailModal(p => ({ ...p, error: 'Пожалуйста, пройдите проверку безопасности' }));
        return;
      }
      await handleSendVerificationCode(); 
    }
  };

  const handleConfirmEmailChange = async () => {
    const { verificationCode, verificationId } = changeEmailModal;
    
    if (!verificationCode || verificationCode.length !== 6) { 
      setChangeEmailModal(p => ({ ...p, error: 'Введите 6-значный код' })); 
      return; 
    }
    if (!verificationId) { 
      setChangeEmailModal(p => ({ ...p, error: 'Сессия истекла. Начните заново.' })); 
      return; 
    }
    
    setChangeEmailModal(p => ({ ...p, isSubmitting: true, error: '' }));
    
    try {
      const request: EndBindEmailRequest = { 
        verificationId,
        confirmationCode: verificationCode 
      };
      const response = await endBindEmail(request);
      
      updateUserEmail(changeEmailModal.newEmail, response.emailChangedDate);
      
      setChangeEmailModal(p => ({ ...p, step: 'success', isSubmitting: false }));
    } catch (err: any) {
      const sc = err?.statusCode || err?.status || 500;
      let msg = 'Произошла ошибка. Попробуйте снова.';
      if (sc === 400) msg = 'Ошибка валидации кода.';
      else if (sc === 403) msg = 'Неверный код подтверждения.';
      else if (sc === 429) { msg = 'Превышено количество попыток.'; setChangeEmailModal(p => ({ ...p, resendTimer: 180 })); }
      else if (sc >= 500) msg = 'Ошибка сервера.';
      setChangeEmailModal(p => ({ ...p, error: msg, isSubmitting: false }));
    }
  };

  const handleEmailModalSubmit = () => {
    if (changeEmailModal.step === 'initial') {
      handleSendVerificationCode();
    } else if (changeEmailModal.step === 'code') {
      handleConfirmEmailChange();
    }
  };

  const renderNavIcon = useCallback((section: SectionType) => {
    switch (section) { case 'security': return <SecurityIcon />; case 'activity': return <ActivityIcon />; case 'schedule': return <ScheduleIcon />; default: return null; }
  }, []);

  return (
    <div style={styles.container}>
      {isMobile && isSidebarOpen && <div style={{...styles.overlay,display:'block'}} onClick={()=>setIsSidebarOpen(false)}/>}
      {isMobile && <header style={styles.mobileHeader}><button style={styles.menuBtn} onClick={()=>setIsSidebarOpen(!isSidebarOpen)} aria-label="Меню"><span style={styles.menuBar}/><span style={styles.menuBar}/><span style={styles.menuBar}/></button><h1 style={{...styles.pageTitle,margin:0,fontSize:18}}>Личный кабинет</h1><div style={{width:40}}/></header>}
      <div style={styles.pageHeader}><div><h1 style={styles.pageTitle}>Личный кабинет</h1><p style={styles.pageDesc}>Управление профилем и настройками аккаунта</p></div></div>
      <div style={styles.layout}>
        <aside style={{...styles.sidebar,left:isMobile?(isSidebarOpen?'0':'-280px'):0}}>
          <div style={styles.profileCard}>
            <div style={styles.avatar}>{getInitials(authUser?.name||'')}</div>
            <h3 style={styles.profileName}>{authUser?.name||'Пользователь'}</h3>
            <p style={styles.profileEmail}>{authUser?.email || 'Email не указан'}</p>
            <div style={styles.profileMeta}><div style={styles.profileMetaItem}><span>На сайте с</span><span>{formatDate(authUser?.registrationDate||'')}</span></div></div>
          </div>
          <nav style={styles.navMenu}>
            {(['security','activity','schedule'] as SectionType[]).map(sec=>(<button key={sec} style={styles.navItem(activeSection===sec)} onClick={()=>{setActiveSection(sec);if(isMobile)setIsSidebarOpen(false);}}>{renderNavIcon(sec)}{sec==='security'?'Безопасность':sec==='activity'?'Активность':'Расписание'}</button>))}
          </nav>
        </aside>
        <main style={styles.contentArea}>
          {isLoading ? <div style={styles.sectionCard}><div style={styles.emptyState}><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" style={{animation:'spin 1s linear infinite',margin:'0 auto'}}><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10"/></svg><p style={{marginTop:12}}>Загрузка...</p></div></div> : activeSection==='security' ? <SecuritySection styles={styles} onChangePassword={handleChangePasswordClick} onChangeEmail={handleChangeEmailClick} userInfo={authUser}/> : activeSection==='schedule' ? <ScheduleSection scheduleDate={scheduleDate} scheduleEvents={scheduleEvents} eventsLoading={eventsLoading} styles={styles} isMobile={isMobile} onDateChange={setScheduleDate}/> : <ActivitySection sessions={sessions} sessionsLoading={sessionsLoading} sessionsError={sessionsError} currentPage={currentPage} totalPages={totalPages} canGoPrev={canGoPrev} canGoNext={canGoNext} terminatingSessionId={terminatingSessionId} currentLoginId={currentLoginId} styles={styles} isMobile={isMobile} onTerminateClick={handleTerminateClick} onPageChange={handlePageChange} onRetry={()=>loadSessions(currentPage)} onTerminateAll={handleTerminateAllClick}/>}
        </main>
      </div>
      <TerminateModal isOpen={terminateModal.isOpen} sessionInfo={terminateModal.sessionInfo} onCancel={handleTerminateCancel} onConfirm={handleTerminateConfirm} terminating={terminatingSessionId!==null} styles={styles} isMobile={isMobile}/>
      <TerminateAllModal isOpen={terminateAllModal.isOpen} sessionsCount={sessions.length} onCancel={handleTerminateAllCancel} onConfirm={terminateAllSessions} styles={styles}/>
      <ChangePasswordModal modal={changePasswordModal} isChanging={isChangingPassword} onChange={handlePasswordChange} onSubmit={handlePasswordSubmit} onCancel={handlePasswordModalCancel} styles={styles} validate={validatePassword}/>
      <ChangeEmailModal 
        isOpen={changeEmailModal.isOpen} 
        step={changeEmailModal.step} 
        newEmail={changeEmailModal.newEmail} 
        verificationCode={changeEmailModal.verificationCode} 
        currentPassword={changeEmailModal.currentPassword} 
        error={changeEmailModal.error} 
        isSubmitting={changeEmailModal.isSubmitting} 
        resendTimer={changeEmailModal.resendTimer} 
        styles={styles} 
        isMobile={isMobile} 
        onNewEmailChange={(v)=>handleEmailModalChange('newEmail',v)} 
        onPasswordChange={(v)=>handleEmailModalChange('currentPassword',v)} 
        onCodeChange={(v)=>handleEmailModalChange('verificationCode',v)} 
        onSubmit={handleEmailModalSubmit}
        onCancel={handleEmailModalCancel} 
        onResendCode={handleResendEmailCode} 
        onStepBack={handleEmailStepBack}
        // CAPTCHA props
        captchaToken={changeEmailCaptchaToken}
        setCaptchaToken={setChangeEmailCaptchaToken}
        captchaRef={changeEmailCaptchaRef}
      />
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}button:focus{outline:none!important}input[type="date"]::-webkit-calendar-picker-indicator{cursor:pointer}table tbody tr:hover{background-color:#f9fafb}@media(max-width:767px){input,select,textarea{font-size:16px!important}}.timeline-event:hover{filter:brightness(0.95);transform:translateY(-1px);z-index:10}.timeline-scroll-container::-webkit-scrollbar{width:6px;height:6px}.timeline-scroll-container::-webkit-scrollbar-track{background:transparent;border-radius:4px}.timeline-scroll-container::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:4px}.timeline-scroll-container::-webkit-scrollbar-thumb:hover{background:#94a3b8}.timeline-scroll-container{scrollbar-width:thin;scrollbar-color:#cbd5e1 transparent}.g-recaptcha > div { margin: 0 auto; }@media (max-width: 767px) { .g-recaptcha { transform: scale(0.9); transform-origin: left center; } }`}</style>
    </div>
  );
};

export default CabinetPage;