class ExpertProfile < ApplicationRecord
    # associations
    belongs_to :user
        # correlates to has_one :expert_profile in User

    # validations
    validates :user_id, presence: true, uniqueness: true
        # each user can only have one expert profile

    # callbacks
    before_validation :initialize_knowledge_base_links
        # ensure knowledge_base_links is always an array

    # instance methods
    def add_knowledge_base_link(url)
        self.knowledge_base_links ||= []
        self.knowledge_base_links << url unless self.knowledge_base_links.include?(url)
        save
    end

    def remove_knowledge_base_link(url)
        self.knowledge_base_links ||= []
        self.knowledge_base_links.delete(url)
        save
    end

    private

    def initialize_knowledge_base_links
        self.knowledge_base_links ||= []
    end

end
