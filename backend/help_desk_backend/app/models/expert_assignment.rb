class ExpertAssignment < ApplicationRecord

    # associations
    belongs_to :conversation
    belongs_to :expert, class_name: 'User', foreign_key: 'expert_id'

    # validations
    validates :conversation_id, presence: true
    validates :expert_id, presence: true
    validates :status, presence: true, inclusion: { in: %w[active resolved] }
    validates :assigned_at, presence: true

    # callbacks
    before_validation :set_assigned_at, on: :create

    # instance methods
    def resolve!
        update(status: 'resolved', resolved_at: Time.current)
    end

    private

    def set_assigned_at
        self.assigned_at ||= Time.current
    end

end
