import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native';
import Svg, { Path, Circle, Line, Polygon as SvgPolygon, G } from 'react-native-svg';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../constants/colors';
import { POLY_FIELDS } from '../constants/schema';
import Header from '../components/Header';
import Button from '../components/Button';
import { getPolygonById, updatePolygon } from '../database/queries';
import type { RootStackParamList, Polygon } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'EditPolygon'>;
type Route = RouteProp<RootStackParamList, 'EditPolygon'>;

// Icons
function CheckIcon() {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
      <Path d="M5 13l4 4L19 7" stroke={colors.bg} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function MoveIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20" stroke={colors.green} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PlusIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={colors.text3} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

function TrashIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke={colors.text3} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// Select field options by key
const SELECT_OPTIONS: Record<string, readonly string[]> = {
  practice: POLY_FIELDS.practice.options,
  target_sys: POLY_FIELDS.target_sys.options,
  distr: POLY_FIELDS.distr.options,
};

interface FormData {
  poly_name: string;
  plantstart: string;
  practice: string;
  target_sys: string;
  distr: string;
  num_trees: string;
}

export default function EditPolygonScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { polygonId } = route.params;

  const [polygon, setPolygon] = useState<Polygon | null>(null);
  const [form, setForm] = useState<FormData>({
    poly_name: '',
    plantstart: '',
    practice: '',
    target_sys: '',
    distr: '',
    num_trees: '',
  });

  useEffect(() => {
    loadPolygon();
  }, [polygonId]);

  const loadPolygon = async () => {
    const pg = await getPolygonById(polygonId);
    if (pg) {
      setPolygon(pg);
      setForm({
        poly_name: pg.poly_name,
        plantstart: pg.plantstart,
        practice: pg.practice,
        target_sys: pg.target_sys,
        distr: pg.distr,
        num_trees: String(pg.num_trees || ''),
      });
    }
  };

  const handleSave = async () => {
    if (!polygon) return;
    if (!form.poly_name || !form.practice) {
      Alert.alert('Required', 'Fill in Polygon Name and Practice');
      return;
    }
    await updatePolygon(polygon.id, {
      poly_name: form.poly_name,
      plantstart: form.plantstart,
      practice: form.practice,
      target_sys: form.target_sys,
      distr: form.distr,
      num_trees: parseInt(form.num_trees, 10) || 0,
    });
    navigation.goBack();
  };

  const updateField = (key: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  if (!polygon) return null;

  return (
    <View style={styles.container}>
      <Header
        title="Edit Polygon"
        subtitle={polygon.poly_name}
        onBack={() => navigation.goBack()}
        right={
          <Button small variant="primary" onPress={handleSave}>
            <Text style={styles.saveBtnText}>Save</Text>
          </Button>
        }
      />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Geometry editor preview */}
        <View style={styles.geoPreview}>
          <Svg width="100%" height="100%">
            <SvgPolygon
              points="60,15 140,10 170,45 155,80 70,85 40,55"
              fill={colors.green}
              fillOpacity={0.08}
              stroke={colors.green}
              strokeWidth={1.5}
              strokeDasharray="4,3"
            />
            {/* Draggable vertices */}
            {[[60, 15], [140, 10], [170, 45], [155, 80], [70, 85], [40, 55]].map(([x, y], i) => (
              <G key={i}>
                <Circle cx={x} cy={y} r={10} fill={colors.green} opacity={0.15} />
                <Circle cx={x} cy={y} r={5} fill={colors.green} stroke={colors.bg} strokeWidth={2} />
              </G>
            ))}
            {/* Midpoint add handles */}
            {[[100, 12], [155, 27], [162, 62], [112, 82], [55, 50], [50, 35]].map(([x, y], i) => (
              <G key={`m${i}`}>
                <Circle cx={x} cy={y} r={4} fill="none" stroke={colors.green} strokeWidth={1} strokeDasharray="2,2" opacity={0.5} />
                <Line x1={x - 3} y1={y} x2={x + 3} y2={y} stroke={colors.green} strokeWidth={1} opacity={0.5} />
                <Line x1={x} y1={y - 3} x2={x} y2={y + 3} stroke={colors.green} strokeWidth={1} opacity={0.5} />
              </G>
            ))}
          </Svg>
          <View style={styles.geoLabel}>
            <Text style={styles.geoLabelText}>Drag vertices to reshape</Text>
          </View>
          <View style={styles.geoHint}>
            <Text style={styles.geoHintText}>+ Tap midpoints to add vertex</Text>
          </View>
        </View>

        {/* Edit tools */}
        <View style={styles.toolRow}>
          {[
            { icon: <MoveIcon />, label: 'Move vertex', active: true },
            { icon: <PlusIcon />, label: 'Add vertex', active: false },
            { icon: <TrashIcon />, label: 'Remove vertex', active: false },
          ].map((tool, i) => (
            <View
              key={i}
              style={[
                styles.toolCard,
                tool.active && styles.toolCardActive,
              ]}
            >
              {tool.icon}
              <Text style={[styles.toolLabel, tool.active && styles.toolLabelActive]}>
                {tool.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Attribute form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Edit Attributes</Text>
          {(Object.entries(POLY_FIELDS) as [keyof FormData, typeof POLY_FIELDS[keyof typeof POLY_FIELDS]][]).map(
            ([key, field]) => (
              <View key={key} style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  {field.label}
                  {field.required && <Text style={styles.required}> *</Text>}
                </Text>
                {field.type === 'select' ? (
                  <View style={styles.selectGroup}>
                    {SELECT_OPTIONS[key]?.map((opt) => (
                      <TouchableOpacity
                        key={opt}
                        onPress={() => updateField(key, opt)}
                        style={[
                          styles.selectOption,
                          form[key] === opt && styles.selectOptionActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.selectOptionText,
                            form[key] === opt && styles.selectOptionTextActive,
                          ]}
                          numberOfLines={1}
                        >
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <TextInput
                    value={form[key]}
                    onChangeText={(v) => updateField(key, v)}
                    placeholder={'placeholder' in field ? (field.placeholder as string) : ''}
                    placeholderTextColor={colors.text3}
                    keyboardType={field.type === 'number' ? 'numeric' : 'default'}
                    style={styles.input}
                  />
                )}
              </View>
            )
          )}
        </View>

        {/* Bottom buttons */}
        <View style={styles.bottomRow}>
          <Button onPress={() => navigation.goBack()} style={{ flex: 1 }}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Button>
          <Button variant="primary" onPress={handleSave} style={{ flex: 1 }}>
            <CheckIcon />
            <Text style={styles.saveBtnText}>Save Changes</Text>
          </Button>
        </View>
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
  saveBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.bg,
  },
  // Geometry preview
  geoPreview: {
    height: 130,
    borderRadius: 12,
    backgroundColor: '#0b1810',
    borderWidth: 1,
    borderColor: colors.green,
    marginBottom: 16,
    overflow: 'hidden',
  },
  geoLabel: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(8,13,10,0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  geoLabelText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.green,
  },
  geoHint: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(8,13,10,0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  geoHintText: {
    fontSize: 9,
    color: colors.text3,
    fontVariant: ['tabular-nums'],
  },
  // Edit tools
  toolRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  toolCard: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 9,
    alignItems: 'center',
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toolCardActive: {
    backgroundColor: colors.greenBg2,
    borderColor: colors.greenDim,
  },
  toolLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.text3,
    marginTop: 3,
  },
  toolLabelActive: {
    color: colors.green,
  },
  // Form
  formCard: {
    borderRadius: 12,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 14,
  },
  formTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text3,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  fieldGroup: {
    marginBottom: 13,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text3,
    marginBottom: 4,
  },
  required: {
    color: colors.red,
    fontSize: 10,
  },
  input: {
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text1,
    fontSize: 13,
  },
  selectGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  selectOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectOptionActive: {
    backgroundColor: colors.greenBg2,
    borderColor: colors.greenDim,
  },
  selectOptionText: {
    fontSize: 11,
    color: colors.text3,
  },
  selectOptionTextActive: {
    color: colors.green,
    fontWeight: '700',
  },
  // Bottom
  bottomRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text1,
  },
});
