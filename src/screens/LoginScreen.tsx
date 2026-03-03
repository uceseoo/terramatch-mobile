import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { getOrganizations } from '../database/seed';
import Logo from '../components/Logo';
import Card from '../components/Card';
import Button from '../components/Button';
import type { UserRole } from '../types';

// Icons
function UserIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"
        stroke={colors.green}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ShieldIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke={colors.green}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BackIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 18l-6-6 6-6"
        stroke={colors.green}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function LoginScreen() {
  const { login, isDbReady } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [name, setName] = useState('');
  const [org, setOrg] = useState('');
  const [showOrgPicker, setShowOrgPicker] = useState(false);
  const [orgSearch, setOrgSearch] = useState('');

  const orgs = useMemo(() => getOrganizations(), []);
  const filteredOrgs = useMemo(
    () =>
      orgSearch
        ? orgs.filter((o) => o.toLowerCase().includes(orgSearch.toLowerCase()))
        : orgs,
    [orgs, orgSearch]
  );

  const canSubmit = name.trim() && (role === 'dqa' || org);

  const handleLogin = async () => {
    if (!canSubmit || !role) return;
    const organization = role === 'dqa' ? 'WRI' : org;
    await login(name.trim(), role, organization);
  };

  const roles = [
    {
      id: 'champion' as UserRole,
      icon: <UserIcon />,
      label: 'Restoration Champion',
      desc: 'Collect field data for my project',
    },
    {
      id: 'dqa' as UserRole,
      icon: <ShieldIcon />,
      label: 'WRI Data Quality Analyst',
      desc: 'Review & validate all project data',
    },
  ];

  if (!isDbReady) {
    return (
      <View style={styles.loadingContainer}>
        <Logo size="large" />
        <Text style={styles.loadingText}>Setting up database...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoSection}>
          <Logo size="large" />
          <Text style={styles.tagline}>
            Field data collection for restoration monitoring
          </Text>
        </View>

        {/* Role Selection */}
        {!role ? (
          <View>
            <Text style={styles.sectionLabel}>I AM A...</Text>
            {roles.map((r) => (
              <Card key={r.id} onPress={() => setRole(r.id)}>
                <View style={styles.roleRow}>
                  <View style={styles.roleIconBox}>{r.icon}</View>
                  <View style={styles.roleTextBox}>
                    <Text style={styles.roleLabel}>{r.label}</Text>
                    <Text style={styles.roleDesc}>{r.desc}</Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        ) : (
          <View>
            {/* Back */}
            <TouchableOpacity
              onPress={() => {
                setRole(null);
                setName('');
                setOrg('');
              }}
              style={styles.backButton}
            >
              <BackIcon />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>

            {/* Name */}
            <View style={styles.field}>
              <Text style={styles.label}>Your Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Elias"
                placeholderTextColor={colors.text3}
                style={styles.input}
                autoCapitalize="words"
              />
            </View>

            {/* Organization (champions only) */}
            {role === 'champion' && (
              <View style={styles.field}>
                <Text style={styles.label}>Your Organization</Text>
                <TouchableOpacity
                  onPress={() => setShowOrgPicker(!showOrgPicker)}
                  style={[styles.input, styles.picker]}
                >
                  <Text style={org ? styles.pickerText : styles.pickerPlaceholder}>
                    {org || 'Select your organization...'}
                  </Text>
                </TouchableOpacity>

                {showOrgPicker && (
                  <View style={styles.dropdown}>
                    <TextInput
                      value={orgSearch}
                      onChangeText={setOrgSearch}
                      placeholder="Search organizations..."
                      placeholderTextColor={colors.text3}
                      style={styles.searchInput}
                      autoFocus
                    />
                    <ScrollView
                      style={styles.dropdownList}
                      nestedScrollEnabled
                      keyboardShouldPersistTaps="handled"
                    >
                      {filteredOrgs.map((o) => (
                        <TouchableOpacity
                          key={o}
                          onPress={() => {
                            setOrg(o);
                            setShowOrgPicker(false);
                            setOrgSearch('');
                          }}
                          style={[
                            styles.dropdownItem,
                            org === o && styles.dropdownItemSelected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.dropdownItemText,
                              org === o && styles.dropdownItemTextSelected,
                            ]}
                          >
                            {o}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            )}

            {/* Submit */}
            <Button
              variant="primary"
              onPress={handleLogin}
              disabled={!canSubmit}
              style={styles.submitButton}
            >
              {role === 'champion' ? 'Enter as Champion' : 'Enter as DQA'}
            </Button>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    color: colors.text3,
    fontSize: 13,
    marginTop: 8,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 36,
  },
  tagline: {
    marginTop: 12,
    fontSize: 13,
    color: colors.text3,
    lineHeight: 20,
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text3,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  roleIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.greenBg2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleTextBox: {
    flex: 1,
  },
  roleLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text1,
  },
  roleDesc: {
    fontSize: 11,
    color: colors.text3,
    marginTop: 2,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  backText: {
    color: colors.green,
    fontSize: 12,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text3,
    marginBottom: 5,
  },
  input: {
    width: '100%',
    padding: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text1,
    fontSize: 14,
  },
  picker: {
    justifyContent: 'center',
  },
  pickerText: {
    color: colors.text1,
    fontSize: 13,
  },
  pickerPlaceholder: {
    color: colors.text3,
    fontSize: 13,
  },
  dropdown: {
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: colors.surface1,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  searchInput: {
    padding: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    color: colors.text1,
    fontSize: 13,
  },
  dropdownList: {
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 11,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownItemSelected: {
    backgroundColor: colors.greenBg,
  },
  dropdownItemText: {
    fontSize: 13,
    color: colors.text2,
  },
  dropdownItemTextSelected: {
    color: colors.green,
    fontWeight: '600',
  },
  submitButton: {
    width: '100%',
    marginTop: 8,
  },
});
