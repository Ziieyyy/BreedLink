import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import Icon from './Icon';
import { colors } from '../styles/commonStyles';

interface CatProfileSearchMenuProps {
  catId: string;
  catName: string;
  ownerName?: string;
}

export default function CatProfileSearchMenu({ catId, catName, ownerName }: CatProfileSearchMenuProps) {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);

  const handleReportUser = () => {
    setMenuVisible(false);
    router.push({
      pathname: "/report-user",
      params: {
        userName: ownerName || catName,
      },
    });
  };

  return (
    <View>
      <TouchableOpacity 
        style={styles.moreButton} 
        onPress={() => setMenuVisible(true)}
      >
        <Icon name="ellipsis-horizontal" size={24} color={colors.text} />
      </TouchableOpacity>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity 
          style={styles.overlay} 
          onPress={() => setMenuVisible(false)}
          activeOpacity={1}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={handleReportUser}
            >
              <Text style={styles.menuText}>Report User</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  moreButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.backgroundAlt,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 80,
    paddingRight: 20,
  },
  menuContainer: {
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 200,
    paddingVertical: 8,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  menuText: {
    fontSize: 16,
    color: colors.text,
  },
});