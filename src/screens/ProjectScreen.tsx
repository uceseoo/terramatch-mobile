import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useNavigation, useRoute, useFocusEffect, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../constants/colors';
import Header from '../components/Header';
import Card from '../components/Card';
import { getProjectById } from '../database/queries';
import { getSitesForProject } from '../database/queries';
import type { RootStackParamList, Project, Site } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Project'>;
type Route = RouteProp<RootStackParamList, 'Project'>;

function PinIcon() {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
        stroke={colors.green}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={9} r={2.5} stroke={colors.green} strokeWidth={1.6} />
    </Svg>
  );
}

interface SiteWithCount extends Site {
  polygonCount: number;
  projectName: string;
}

interface ProjectWithCount extends Project {
  siteCount: number;
}

export default function ProjectScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { projectId } = route.params;

  const [project, setProject] = useState<ProjectWithCount | null>(null);
  const [sites, setSites] = useState<SiteWithCount[]>([]);

  // Reload on focus to pick up new polygons
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [projectId])
  );

  const loadData = async () => {
    const p = await getProjectById(projectId);
    setProject(p);
    const s = await getSitesForProject(projectId);
    setSites(s);
  };

  if (!project) return null;

  return (
    <View style={styles.container}>
      <Header
        title={project.name}
        subtitle={project.landscape}
        onBack={() => navigation.goBack()}
      />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Info banner */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoText}>
            <Text style={styles.infoLabel}>Landscape: </Text>
            {project.landscape}
            {'\n'}
            <Text style={styles.infoLabel}>Sites: </Text>
            {sites.length}
          </Text>
        </View>

        {/* Sites list */}
        <Text style={styles.sectionHeader}>Sites</Text>
        {sites.map((site) => (
          <Card
            key={site.id}
            onPress={() =>
              navigation.navigate('Site', {
                siteId: site.id,
                projectName: project.name,
              })
            }
          >
            <View style={styles.siteRow}>
              <View style={styles.siteInfo}>
                <View style={styles.siteName}>
                  <PinIcon />
                  <Text style={styles.siteNameText}>{site.name}</Text>
                </View>
                <Text style={styles.polyCount}>{site.polygonCount} polygons</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </View>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 18,
    paddingTop: 14,
  },
  infoBanner: {
    padding: 12,
    borderRadius: 11,
    backgroundColor: colors.greenBg,
    borderWidth: 1,
    borderColor: 'rgba(39,201,147,0.12)',
    marginBottom: 16,
  },
  infoText: {
    fontSize: 12,
    color: colors.green,
    lineHeight: 20,
  },
  infoLabel: {
    fontWeight: '700',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text3,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  siteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  siteInfo: {
    flex: 1,
  },
  siteName: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  siteNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text1,
    flex: 1,
  },
  polyCount: {
    fontSize: 11,
    color: colors.text3,
    marginLeft: 19,
  },
  chevron: {
    fontSize: 20,
    color: colors.text3,
  },
});
