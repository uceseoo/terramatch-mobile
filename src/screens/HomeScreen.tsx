import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { getDatabase } from '../database/db';
import { LANDSCAPE_FILTERS, type LandscapeFilter } from '../constants/landscapes';
import Logo from '../components/Logo';
import Card from '../components/Card';
import type { Project, RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

// ─── Icons ───
function SearchIcon() {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
        stroke={colors.text3}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LogoutIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
        stroke={colors.text3}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function FolderIcon({ size = 11 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
        stroke={colors.text3}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PinIcon({ size = 11 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
        stroke={colors.text3}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={9} r={2.5} stroke={colors.text3} strokeWidth={1.6} />
    </Svg>
  );
}

function PolygonIcon({ size = 11 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 6l4-3 8 2 4 5-2 8-6 2-6-4z"
        stroke={colors.text3}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LayersIcon({ size = 11 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
        stroke={colors.text3}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Extended project with site count
interface ProjectWithCount extends Project {
  siteCount: number;
}

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { user, logout } = useAuth();
  const [search, setSearch] = useState('');
  const [landscapeFilter, setLandscapeFilter] = useState<LandscapeFilter>('all');
  const [projects, setProjects] = useState<ProjectWithCount[]>([]);
  const [polygonCount, setPolygonCount] = useState(0);

  // Load projects from database
  useEffect(() => {
    loadProjects();
    loadPolygonCount();
  }, []);

  const loadProjects = useCallback(async () => {
    const db = await getDatabase();
    const rows = await db.getAllAsync<ProjectWithCount>(
      `SELECT p.*, COUNT(s.id) as siteCount
       FROM projects p
       LEFT JOIN sites s ON s.project_id = p.id
       GROUP BY p.id
       ORDER BY p.name`
    );
    setProjects(rows);
  }, []);

  const loadPolygonCount = useCallback(async () => {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM polygons'
    );
    setPolygonCount(result?.count ?? 0);
  }, []);

  // Filter projects
  const visibleProjects = useMemo(() => {
    let list = projects;

    // Champion: only their org's projects
    if (user?.role === 'champion') {
      list = list.filter((p) => p.name === user.organization);
    }

    // Landscape filter (DQA only)
    if (landscapeFilter !== 'all') {
      list = list.filter((p) => p.landscape === landscapeFilter);
    }

    // Search
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.landscape.toLowerCase().includes(q) ||
          p.organization.toLowerCase().includes(q)
      );
    }

    return list;
  }, [projects, user, landscapeFilter, search]);

  // Compute stats
  const stats = useMemo(
    () => ({
      projects: visibleProjects.length,
      sites: visibleProjects.reduce((a, p) => a + (p.siteCount || 0), 0),
      polygons: polygonCount,
    }),
    [visibleProjects, polygonCount]
  );

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarRow}>
          <Logo size="small" />
          <View style={styles.topBarRight}>
            <View
              style={[
                styles.roleBadge,
                user?.role === 'dqa' ? styles.roleBadgeDqa : styles.roleBadgeChampion,
              ]}
            >
              <Text
                style={[
                  styles.roleBadgeText,
                  user?.role === 'dqa' ? styles.roleBadgeDqaText : styles.roleBadgeChampionText,
                ]}
              >
                {user?.role === 'dqa' ? 'DQA' : 'Champion'}
              </Text>
            </View>
            <TouchableOpacity onPress={logout} style={styles.logoutButton}>
              <LogoutIcon />
            </TouchableOpacity>
          </View>
        </View>

        {/* Welcome */}
        <Text style={styles.welcome}>
          Welcome back,{' '}
          <Text style={styles.welcomeName}>{user?.name}</Text>
          {user?.role === 'champion' && (
            <Text style={styles.welcomeOrg}> · {user?.organization}</Text>
          )}
        </Text>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {[
            { n: stats.projects, label: 'Projects', icon: <FolderIcon /> },
            { n: stats.sites, label: 'Sites', icon: <PinIcon /> },
            { n: stats.polygons, label: 'Collected', icon: <PolygonIcon /> },
          ].map((s, i) => (
            <View key={i} style={styles.statCard}>
              <Text style={styles.statNumber}>{s.n}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Landscape Filter (DQA only) */}
        {user?.role === 'dqa' && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterRow}
            contentContainerStyle={styles.filterRowContent}
          >
            {LANDSCAPE_FILTERS.map((l) => (
              <TouchableOpacity
                key={l}
                onPress={() => setLandscapeFilter(l)}
                style={[
                  styles.filterPill,
                  landscapeFilter === l && styles.filterPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    landscapeFilter === l && styles.filterPillTextActive,
                  ]}
                >
                  {l === 'all' ? 'All Landscapes' : l}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <SearchIcon />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search projects or sites..."
            placeholderTextColor={colors.text3}
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* Project List */}
      <ScrollView style={styles.listContainer} contentContainerStyle={styles.listContent}>
        <Text style={styles.listHeader}>
          {user?.role === 'dqa'
            ? `${visibleProjects.length} Projects`
            : 'My Projects'}
        </Text>

        {visibleProjects.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {search
                ? 'No projects match your search'
                : 'No projects found'}
            </Text>
          </View>
        ) : (
          visibleProjects.map((project) => (
            <Card
              key={project.id}
              onPress={() => navigation.navigate('Project', { projectId: project.id })}
            >
              <Text style={styles.projectName}>{project.name}</Text>
              <View style={styles.projectMeta}>
                <View style={styles.metaItem}>
                  <LayersIcon />
                  <Text style={styles.metaText}>{project.landscape}</Text>
                </View>
                <View style={styles.metaItem}>
                  <PinIcon />
                  <Text style={styles.metaText}>
                    {project.siteCount} site{project.siteCount !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topBar: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface1,
  },
  topBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  roleBadgeDqa: {
    backgroundColor: colors.amberBg,
    borderColor: colors.amber,
  },
  roleBadgeChampion: {
    backgroundColor: colors.greenBg,
    borderColor: colors.greenDim,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  roleBadgeDqaText: {
    color: colors.amber,
  },
  roleBadgeChampionText: {
    color: colors.green,
  },
  logoutButton: {
    padding: 4,
  },
  welcome: {
    fontSize: 13,
    color: colors.text2,
    marginBottom: 14,
  },
  welcomeName: {
    color: colors.text1,
    fontWeight: '700',
  },
  welcomeOrg: {
    color: colors.green,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text1,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 9,
    color: colors.text3,
    marginTop: 2,
  },
  filterRow: {
    marginBottom: 12,
  },
  filterRowContent: {
    gap: 6,
  },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: {
    backgroundColor: colors.greenBg2,
    borderColor: colors.greenDim,
  },
  filterPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text3,
  },
  filterPillTextActive: {
    color: colors.green,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    color: colors.text1,
    fontSize: 13,
    padding: 0,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 18,
    paddingTop: 14,
  },
  listHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text3,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  projectName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text1,
    marginBottom: 5,
  },
  projectMeta: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 11,
    color: colors.text3,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: colors.text3,
  },
});
