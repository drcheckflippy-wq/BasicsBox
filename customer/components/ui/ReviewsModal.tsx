import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import { addReview, updateReview, deleteReview } from '../../services/api';

interface Review {
  user_email: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface ReviewsModalProps {
  visible: boolean;
  restaurantId: number | null;
  reviews: { [key: number]: Review[] };
  loadingReviews: { [key: number]: boolean };
  userHasReviewed: { [key: number]: boolean };
  onClose: () => void;
  onReviewAdded: (restaurantId: number) => void;
}

export default function ReviewsModal({
  visible,
  restaurantId,
  reviews,
  loadingReviews,
  userHasReviewed,
  onClose,
  onReviewAdded,
}: ReviewsModalProps) {
  const { colors } = useTheme();
  const { isAuthenticated, userEmail } = useAuth();
  
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState('');
  const [deletingReview, setDeletingReview] = useState(false);

  if (!restaurantId) return null;

  const currentReviews = reviews[restaurantId] || [];
  const isLoading = loadingReviews[restaurantId] || false;
  const hasReviewed = userHasReviewed[restaurantId] || false;

  const handleAddReview = async () => {
    if (userRating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }
    if (!isAuthenticated) {
      Alert.alert('Error', 'Please login to add a review');
      return;
    }

    setSubmittingReview(true);
    try {
      await addReview(restaurantId, userRating, userComment);
      Alert.alert('Success', 'Review added!');
      onReviewAdded(restaurantId);
      setUserRating(0);
      setUserComment('');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to add review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleEditReview = async () => {
    if (editRating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    setSubmittingReview(true);
    try {
      await updateReview(restaurantId, editRating, editComment);
      Alert.alert('Success', 'Review updated!');
      onReviewAdded(restaurantId);
      setEditingReview(null);
      setEditRating(0);
      setEditComment('');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async () => {
    Alert.alert(
      'Delete Review',
      'Are you sure you want to delete your review?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingReview(true);
            try {
              await deleteReview(restaurantId);
              Alert.alert('Success', 'Review deleted!');
              onReviewAdded(restaurantId);
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to delete review');
            } finally {
              setDeletingReview(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderStars = (rating: number, onPress?: (rating: number) => void, size = 28) => {
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onPress && onPress(star)}
            disabled={!onPress}
          >
            <Icon
              name="star"
              size={size}
              color={star <= rating ? '#fbbf24' : colors.textMuted}
              style={star <= rating ? styles.starFilled : styles.starEmpty}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[styles.modal, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Ratings & Reviews</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="x" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Add/Edit Review Section */}
            {isAuthenticated && !editingReview && (
              <>
                {hasReviewed ? (
                  <View style={[styles.reviewedBanner, { backgroundColor: `${colors.success}20`, borderColor: `${colors.success}40` }]}>
                    <Icon name="star" size={16} color={colors.success} />
                    <Text style={[styles.reviewedText, { color: colors.success }]}>Already reviewed</Text>
                  </View>
                ) : (
                  <View style={[styles.writeReviewCard, { backgroundColor: colors.cardHover, borderColor: colors.border }]}>
                    <Text style={[styles.writeReviewTitle, { color: colors.textPrimary }]}>Rate your experience</Text>
                    {renderStars(userRating, setUserRating, 32)}
                    <TextInput
                      style={[styles.textArea, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textPrimary }]}
                      placeholder="Tell us about your experience..."
                      placeholderTextColor={colors.textMuted}
                      multiline
                      numberOfLines={3}
                      value={userComment}
                      onChangeText={setUserComment}
                    />
                    <TouchableOpacity
                      onPress={handleAddReview}
                      disabled={submittingReview || userRating === 0}
                      style={[styles.submitButton, (submittingReview || userRating === 0) && styles.disabledButton]}
                    >
                      <LinearGradient
                        colors={[colors.brandPrimary, colors.brandSecondary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.submitGradient}
                      >
                        {submittingReview ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={styles.submitText}>Submit Review</Text>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}

            {!isAuthenticated && (
              <View style={[styles.loginBanner, { backgroundColor: `${colors.brandPrimary}20`, borderColor: `${colors.brandPrimary}40` }]}>
                <Icon name="lock" size={16} color={colors.brandPrimary} />
                <Text style={[styles.loginText, { color: colors.brandPrimary }]}>Login to write a review</Text>
              </View>
            )}

            {/* Reviews List */}
            <Text style={[styles.reviewsLabel, { color: colors.textMuted }]}>
              All Reviews ({currentReviews.length})
            </Text>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.brandPrimary} />
              </View>
            ) : currentReviews.length > 0 ? (
              currentReviews.map((review, index) => {
                const isMine = review.user_email === userEmail;
                return (
                  <View
                    key={index}
                    style={[styles.reviewCard, { backgroundColor: colors.cardHover, borderColor: colors.border }]}
                  >
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewerInfo}>
                        <LinearGradient
                          colors={[colors.brandPrimary, colors.brandSecondary]}
                          style={styles.avatar}
                        >
                          <Text style={styles.avatarText}>{review.user_email[0].toUpperCase()}</Text>
                        </LinearGradient>
                        <View>
                          <Text style={[styles.reviewerName, { color: colors.textPrimary }]}>
                            {review.user_email.split('@')[0]}
                          </Text>
                          {isMine && (
                            <View style={styles.youBadge}>
                              <Text style={styles.youText}>You</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <View style={styles.reviewRating}>
                        {renderStars(review.rating, undefined, 12)}
                      </View>
                    </View>
                    <Text style={[styles.reviewComment, { color: colors.textSecondary }]}>{review.comment}</Text>
                    <View style={styles.reviewFooter}>
                      <Text style={[styles.reviewDate, { color: colors.textMuted }]}>{formatDate(review.created_at)}</Text>
                      {isMine && !editingReview && (
                        <View style={styles.reviewActions}>
                          <TouchableOpacity
                            onPress={() => {
                              setEditingReview(review);
                              setEditRating(review.rating);
                              setEditComment(review.comment);
                            }}
                            style={styles.actionButton}
                          >
                            <Text style={[styles.actionText, { color: colors.brandPrimary }]}>Edit</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={handleDeleteReview} disabled={deletingReview} style={styles.actionButton}>
                            <Text style={[styles.actionText, { color: colors.error }]}>
                              {deletingReview ? '...' : 'Delete'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyReviews}>
                <Icon name="message-circle" size={40} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>No reviews yet. Be the first!</Text>
              </View>
            )}
          </ScrollView>

          {/* Edit Review Modal */}
          {editingReview && (
            <View style={[styles.editModal, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={styles.editHeader}>
                <Text style={[styles.editTitle, { color: colors.textPrimary }]}>Edit Review</Text>
                <TouchableOpacity onPress={() => setEditingReview(null)} style={styles.editClose}>
                  <Icon name="x" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              {renderStars(editRating, setEditRating, 28)}
              <TextInput
                style={[styles.editTextArea, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textPrimary }]}
                placeholder="Update your review..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                value={editComment}
                onChangeText={setEditComment}
              />
              <View style={styles.editActions}>
                <TouchableOpacity
                  onPress={() => setEditingReview(null)}
                  style={[styles.cancelEditButton, { backgroundColor: colors.inputBg }]}
                >
                  <Text style={[styles.cancelEditText, { color: colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleEditReview}
                  disabled={submittingReview || editRating === 0}
                  style={[styles.updateButton, (submittingReview || editRating === 0) && styles.disabledButton]}
                >
                  <LinearGradient
                    colors={[colors.brandPrimary, colors.brandSecondary]}
                    style={styles.updateGradient}
                  >
                    {submittingReview ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.updateText}>Update Review</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    borderTopWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  reviewedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  reviewedText: {
    fontSize: 12,
    fontWeight: '500',
  },
  writeReviewCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
    gap: 12,
  },
  writeReviewTitle: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  starFilled: {
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  starEmpty: {
    opacity: 0.5,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
  loginBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  loginText: {
    fontSize: 12,
    fontWeight: '500',
  },
  reviewsLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  reviewCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    gap: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  reviewerName: {
    fontSize: 13,
    fontWeight: '600',
  },
  youBadge: {
    backgroundColor: 'rgba(249,115,22,0.1)',
    
  paddingHorizontal: 6, // Change from 3 to 6
  paddingVertical: 2,
  borderRadius: 12, // Change from 8 to 12 for rounded corners
  marginTop: 2,
  alignSelf: 'flex-start', // Add this to make badge fit content
  },
  youText: {
    color: '#f97316',
    fontSize: 9,
    fontWeight: 'bold',
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewComment: {
    fontSize: 12,
    lineHeight: 18,
  },
  reviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewDate: {
    fontSize: 10,
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '500',
  },
  emptyReviews: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 12,
  },
  editModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    gap: 16,
  },
  editHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  editClose: {
    padding: 4,
  },
  editTextArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelEditButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelEditText: {
    fontSize: 14,
    fontWeight: '500',
  },
  updateButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  updateGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  updateText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});