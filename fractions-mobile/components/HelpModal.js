import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
} from "react-native";
import {
  UI_DIMENSIONS,
  FONT_SIZES,
  BORDER_RADII,
  ELEVATIONS,
  Z_INDICES,
  HELP_CONFIG,
} from "../constants/quizConstants";

const HelpModal = ({
  visible,
  onClose,
  helpSteps,
  currentStep,
  onNextStep,
  onPrevStep,
  totalSteps,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Help Steps</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.stepsContainer} showsVerticalScrollIndicator={false}>
            <Text style={styles.stepText}>
              {helpSteps[currentStep]}
            </Text>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              onPress={onPrevStep}
              disabled={currentStep === 0}
              style={[
                styles.navButton,
                currentStep === 0 && styles.navButtonDisabled,
              ]}
            >
              <Text
                style={[
                  styles.navButtonText,
                  currentStep === 0 && styles.navButtonTextDisabled,
                ]}
              >
                Previous
              </Text>
            </TouchableOpacity>

            <Text style={styles.stepCounter}>
              {currentStep + 1}/{totalSteps}
            </Text>

            <TouchableOpacity
              onPress={onNextStep}
              disabled={currentStep === totalSteps - 1}
              style={[
                styles.navButton,
                currentStep === totalSteps - 1 && styles.navButtonDisabled,
              ]}
            >
              <Text
                style={[
                  styles.navButtonText,
                  currentStep === totalSteps - 1 && styles.navButtonTextDisabled,
                ]}
              >
                Next
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: BORDER_RADII.HELP_MODAL,
    width: UI_DIMENSIONS.HELP_MODAL_WIDTH,
    height: UI_DIMENSIONS.HELP_MODAL_HEIGHT,
    elevation: ELEVATIONS.HELP_MODAL,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    zIndex: Z_INDICES.FEEDBACK_CONTAINER,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: FONT_SIZES.HELP_TITLE,
    color: "#333",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADII.CLOSE_BUTTON,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: FONT_SIZES.CLOSE_BUTTON,
    color: "#666",
    fontWeight: "bold",
  },
  stepsContainer: {
    flex: 1,
    padding: 16,
  },
  stepText: {
    fontFamily: "Poppins-Regular",
    fontSize: FONT_SIZES.HELP_STEP_TEXT,
    color: "#555",
    lineHeight: 20,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  navButton: {
    backgroundColor: "#4CAF50",
    borderRadius: BORDER_RADII.NAV_BUTTON,
    paddingHorizontal: 16,
    paddingVertical: 8,
    elevation: ELEVATIONS.NAV_BUTTON,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  navButtonDisabled: {
    backgroundColor: "#ccc",
  },
  navButtonText: {
    fontFamily: "Poppins-Bold",
    fontSize: FONT_SIZES.NAV_BUTTON_TEXT,
    color: "#fff",
  },
  navButtonTextDisabled: {
    color: "#999",
  },
  stepCounter: {
    fontFamily: "Poppins-Bold",
    fontSize: FONT_SIZES.LEVEL_TEXT,
    color: "#666",
  },
});

export default HelpModal;
