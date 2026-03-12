'use client';

import {useState} from 'react';

import {Button} from '@heroui/button';
import {Select, SelectItem} from '@heroui/select';

import {translations} from '@/lib/translations';

import {ContentCard, HStack, showToast, VStack} from '@/components';
import {TournamentStatuses} from '@/enums';
import {useFetchBlog, useTournaments} from '@/hooks';
import {Tournament} from '@/types';
import {copyToClipboard} from '@/utils';

interface PublicationTabProps {
  tournamentId: string;
  tournament: Tournament;
  refetch: () => void;
}

const t = translations.tournaments;

export const PublicationTab = ({tournamentId, tournament, refetch}: PublicationTabProps) => {
  const {data: blogPosts, loading: postsLoading} = useFetchBlog();
  const {updateTournament, loading: updateLoading} = useTournaments();
  const [selectedPostId, setSelectedPostId] = useState<string>(tournament.post_id || '');

  const isPublished = tournament.status === TournamentStatuses.PUBLISHED;
  const publicUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/tournaments/${tournament.slug}`
      : `/tournaments/${tournament.slug}`;

  const handlePublish = async () => {
    await updateTournament(tournamentId, {
      id: tournamentId,
      status: TournamentStatuses.PUBLISHED,
    });
    refetch();
  };

  const handleUnpublish = async () => {
    await updateTournament(tournamentId, {
      id: tournamentId,
      status: TournamentStatuses.DRAFT,
    });
    refetch();
  };

  const handleLinkPost = async (postId: string) => {
    setSelectedPostId(postId);
    await updateTournament(tournamentId, {
      id: tournamentId,
      post_id: postId || null,
    });
    refetch();
  };

  const handleCopyLink = () => {
    copyToClipboard(publicUrl);
  };

  return (
    <VStack spacing={4} align="stretch">
      <ContentCard title={t.labels.status}>
        <VStack spacing={4} align="stretch">
          <HStack spacing={2} align="center">
            <span className="text-sm font-medium">{t.labels.status}:</span>
            <span
              className={`text-sm font-semibold ${isPublished ? 'text-success' : 'text-default-500'}`}
            >
              {isPublished ? t.enums.statuses.published : t.enums.statuses.draft}
            </span>
          </HStack>

          <div>
            {isPublished ? (
              <Button
                color="warning"
                variant="flat"
                size="sm"
                onPress={handleUnpublish}
                isLoading={updateLoading}
              >
                {t.actions.unpublish}
              </Button>
            ) : (
              <Button color="success" size="sm" onPress={handlePublish} isLoading={updateLoading}>
                {t.actions.publish}
              </Button>
            )}
          </div>
        </VStack>
      </ContentCard>

      <ContentCard title={t.labels.publicLink}>
        <VStack spacing={3} align="stretch">
          <code className="text-sm bg-default-100 rounded-lg px-3 py-2 block break-all">
            {publicUrl}
          </code>
          <div>
            <Button size="sm" variant="flat" onPress={handleCopyLink}>
              Kopírovat odkaz
            </Button>
          </div>
        </VStack>
      </ContentCard>

      <ContentCard title={t.labels.blogPost} isLoading={postsLoading}>
        <VStack spacing={3} align="stretch">
          <Select
            label={t.labels.blogPost}
            placeholder={t.actions.linkBlogPost}
            selectedKeys={selectedPostId ? [selectedPostId] : []}
            onSelectionChange={(keys) => {
              const key = Array.from(keys)[0] as string;
              handleLinkPost(key || '');
            }}
            isLoading={postsLoading}
          >
            {blogPosts.map((post) => (
              <SelectItem key={post.id}>{post.title}</SelectItem>
            ))}
          </Select>

          {selectedPostId && (
            <Button
              size="sm"
              color="danger"
              variant="light"
              onPress={() => handleLinkPost('')}
              isLoading={updateLoading}
            >
              {translations.common.actions.unassign}
            </Button>
          )}
        </VStack>
      </ContentCard>
    </VStack>
  );
};
