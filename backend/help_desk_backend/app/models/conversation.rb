class Conversation < ApplicationRecord
    
    # associations
    belongs_to :initiator, class_name: 'User', foreign_key: 'initiator_id'
    belongs_to :assigned_expert, class_name: 'User', foreign_key: 'assigned_expert_id', optional: true
    
    has_many :messages, dependent: :destroy
    has_many :expert_assignments, dependent: :destroy

    # validations
    validates :title, presence: true
    validates :status, presence: true, inclusion: { in: %w[waiting active resolved] }
    validates :initiator_id, presence: true

    # instance methods
    def assign_expert(expert)
        update(assigned_expert: expert, status: 'active')
    end

    def unassign_expert
        update(assigned_expert: nil, status: 'waiting')
    end

    def mark_resolved
        update(status: 'resolved')
    end

end
